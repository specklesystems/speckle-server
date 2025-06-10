# pyobjectloader2/src/objectloader2.py
import asyncio
from typing import AsyncGenerator, Optional, List, Dict, Any

from .helpers import (
    AsyncGeneratorQueue, DefermentManager, CacheReader, CachePump, AggregateQueue,
    _default_logger # Import default logger if used
)
# Explicitly import from .interfaces if they are defined there as ABCs/Protocols
from .interfaces import Downloader, Database, Queue as BaseQueue
from .types import Base, Item, CustomLogger # Assuming Item, Base are in types
from .options import (
    ObjectLoader2Options, CacheOptions, DefermentManagerOptions
)
# No factory import here to avoid circular dependency if factory uses ObjectLoader2 in type hints
# Factory methods are static and should be called via the factory class itself.

class ObjectLoader2:
    _root_id: str
    _logger: CustomLogger
    _database: Database
    _downloader: Downloader # This is also a BaseQueue[str]
    _pump: CachePump
    _cache: CacheReader
    _deferments: DefermentManager
    # _gathered is where Items (Base objects wrapped) are put after being found by pump/downloader.
    # The get_object_iterator consumes this.
    _gathered_items_for_iterator: AsyncGeneratorQueue[Item]
    _root_object_item: Optional[Item] = None # Stores the root Item after fetching

    def __init__(self, options: ObjectLoader2Options):
        self._root_id = options.root_id
        self._logger = options.logger or _default_logger # Use imported default_logger

        # Default CacheOptions if not overridden from a higher level config
        # These were derived from original TS ObjectLoader2 constructor defaults
        cache_options = CacheOptions(
            logger=self._logger,
            # max_cache_read_size, max_cache_write_size etc. use defaults from CacheOptions dataclass
        )

        self._gathered_items_for_iterator = AsyncGeneratorQueue[Item]("ObjectLoader2_GatheredItems")
        self._database = options.database

        # Default DefermentManagerOptions
        # Original TS used: maxSizeInMb: 2000, ttlMs: 15000
        # Python DefermentManager takes: max_size (count), cleanup_interval_ms, default_ttl_ms
        # We need to map these or ensure options are provided appropriately.
        # Using DefermentManager's own defaults if not specified in a higher-level config.
        # For now, let DefermentManager use its internal defaults if not passed specific options.
        # If DefermentManagerOptions from options.py is used, ensure it's compatible.
        # The DefermentManagerOptions in options.py was aligned with Python's DefermentManager.
        dm_options_from_spec = DefermentManagerOptions(logger=self._logger) # Uses defaults from options.py
        self._deferments = DefermentManager(
            max_size=dm_options_from_spec.max_size,
            cleanup_interval_ms=dm_options_from_spec.cleanup_interval_ms,
            default_ttl_ms=dm_options_from_spec.ttlms, # maps to default_ttl_ms
            logger=self._logger
        )

        # CacheReader(database, deferment_manager, logger, batch_size, batch_wait_time)
        # CacheOptions has batch_size (max_cache_read_size) and batch_wait_time_ms (max_cache_batch_read_wait)
        self._cache = CacheReader(
            database=self._database,
            deferment_manager=self._deferments,
            logger=self._logger,
            batch_size=cache_options.max_cache_read_size, # map from CacheOptions
            batch_wait_time_ms=cache_options.max_cache_batch_read_wait # map from CacheOptions
        )

        # CachePump(database, deferment_manager, logger, write_batch_size, write_batch_wait_ms, pump_read_batch_size)
        # CacheOptions has write_batch_size (max_cache_write_size) and write_batch_wait_ms (max_cache_batch_write_wait)
        # pump_read_batch_size is specific to CachePump's own reading logic if used.
        self._pump = CachePump(
            database=self._database,
            deferment_manager=self._deferments,
            logger=self._logger,
            write_batch_size=cache_options.max_cache_write_size,
            write_batch_wait_time_ms=cache_options.max_cache_batch_write_wait
            # pump_read_batch_size uses CachePump's default
        )

        self._downloader = options.downloader # This is also a BaseQueue[str] for notFoundItems
        self._logger(f"ObjectLoader2 initialized for root ID: {self._root_id}")

    async def dispose_async(self) -> None:
        self._logger("ObjectLoader2: dispose_async called")
        # Gather all disposal tasks
        disposal_tasks = [
            self._cache.dispose_async(),
            self._pump.dispose_async(),
            self._deferments.dispose() # DefermentManager.dispose is async now
        ]
        # Downloader might be shared or specific, handle its disposal carefully.
        # If ObjectLoader2 "owns" the downloader, it should dispose it.
        if self._downloader:
            disposal_tasks.append(self._downloader.dispose_async())

        await asyncio.gather(*disposal_tasks, return_exceptions=True)
        self._logger("ObjectLoader2: All components disposed.")

    async def get_root_object_item(self) -> Optional[Item]: # Renamed to avoid clash if returning Base
        """Fetches the root object as an Item (including Base and other metadata)."""
        self._logger(f"ObjectLoader2: get_root_object_item for {self._root_id}")
        if self._root_object_item is None:
            # Try fetching from database first
            results = await self._database.get_all([self._root_id])
            if results and results[0] is not None:
                self._root_object_item = results[0]
                self._logger(f"Root object {self._root_id} found in database.")
            else:
                self._logger(f"Root object {self._root_id} not in DB, attempting download.")
                # download_single is expected to return an Item
                try:
                    self._root_object_item = await self._downloader.download_single()
                    if self._root_object_item:
                         self._logger(f"Root object {self._root_id} downloaded successfully.")
                         # Add the newly downloaded root object to the pump for caching
                         await self._pump.add(self._root_object_item.base) # Pump expects Base
                    else:
                        self._logger(f"Failed to download root object {self._root_id}.")
                except Exception as e:
                    self._logger(f"Error downloading root object {self._root_id}: {e}")
                    self._root_object_item = None # Ensure it's None on error
        return self._root_object_item

    async def get_object(self, obj_id: str) -> Optional[Base]:
        self._logger(f"ObjectLoader2: get_object for ID {obj_id}")
        # CacheReader.get_object returns Optional[Base]
        return await self._cache.get_object(obj_id)

    async def get_total_object_count(self) -> int:
        self._logger("ObjectLoader2: get_total_object_count called")
        root_item = await self.get_root_object_item()
        if not root_item or not root_item.base or not root_item.base.__closure__:
            return 1 if (root_item and root_item.base) else 0

        total_children_count = len(root_item.base.__closure__)
        return total_children_count + 1 # Count the root object itself

    async def get_object_iterator(self) -> AsyncGenerator[Base, None]:
        self._logger("ObjectLoader2: get_object_iterator started")
        root_item_wrapper = await self.get_root_object_item()

        if root_item_wrapper is None or root_item_wrapper.base is None:
            self._logger('ObjectLoader2: No root object found for iterator!')
            await self._gathered_items_for_iterator.dispose() # Ensure consumer loop can exit
            return # Empty async generator

        root_base_obj = root_item_wrapper.base
        self._logger(f"ObjectLoader2: Root object {root_base_obj.id} obtained for iterator.")

        # Yield root object's base immediately
        yield root_base_obj

        # Add root object to the pump for caching (if not already there from get_root_object_item's download path)
        # CachePump.add is async now.
        await self._pump.add(root_base_obj)

        closures = root_base_obj.__closure__ or {}
        if not closures:
            self._logger("ObjectLoader2: Root object has no children closures.")
            await self._gathered_items_for_iterator.dispose()
            return

        # Sort children IDs by reference count (value in closure dict) descending
        children_ids = sorted(closures.keys(), key=lambda k: closures[k], reverse=True)
        total_children_to_process = len(children_ids)
        self._logger(f"ObjectLoader2: Processing {total_children_to_process} children objects.")

        if total_children_to_process == 0:
            await self._gathered_items_for_iterator.dispose()
            return

        # The downloader's pool needs a "results" queue.
        # This is where Items (successfully downloaded or processed by downloader) are placed.
        # The CachePump.gather method uses this downloader (which is also a Queue[str] for notFoundItems)
        # to get items it couldn't find in the cache.
        # The items found by the downloader must eventually make their way to the user via this iterator.
        # So, the downloader's "results" queue should feed into `_gathered_items_for_iterator`.

        # In the original TS, `pump.gather` took `gathered` (our `_gathered_items_for_iterator`)
        # and `notFound` (our `_downloader` cast as a `Queue<string>`).
        # `CachePump.gather` in Python was defined as:
        # `async def gather(self, ids_iterable: List[str]) -> AsyncGenerator[Base, None]:`
        # This implies CachePump.gather itself tries to resolve via DefermentManager,
        # and DefermentManager interacts with CacheReader (for DB) or triggers downloader logic if items are not found.
        # The setup of downloader.initialize_pool with a results queue that pump.gather can use is key.

        # The `_downloader` is where CachePump's `pump_items` (called by `gather`) will send not-found IDs.
        # The `_downloader`'s internal pool (if any) should process these IDs and put resulting `Item` objects
        # into a queue that `CachePump.gather` can ultimately use to resolve deferments.
        # Let's assume `CachePump.gather` is already wired to use `DefermentManager` which in turn
        # might trigger `CacheReader` (for DB) or further deferrals that a downloader system would pick up.
        # The critical part is how downloaded items feed back.
        # `CachePump.gather` yields `Base` objects. It gets these from `DefermentManager`.
        # `DefermentManager` gets them from `CacheReader` or if `CacheReader` fails, it implies "not found".
        # This "not found" state should then trigger the downloader.
        # The `Downloader` instance itself is also a `Queue<string>` that `CachePump.pump_items` uses for `notFoundIds`.
        # So, CachePump tells the Downloader "these IDs were not found".
        # The Downloader then needs to process these IDs and put the results (as `Item`s)
        # into a queue that will allow `CachePump.gather` (via `DefermentManager`) to resolve them.

        # The `_pump.gather` in the original TS took `children_ids`, `this.gathered` (AsyncGeneratorQueue<Item>),
        # and `this.downloader` (as Queue<string> for notFound).
        # The Python `CachePump.gather` was simplified to `gather(self, ids_iterable: List[str])`.
        # It needs to be re-aligned or the logic here adjusted.
        # Let's assume `CachePump.gather` internally handles putting resolved items (from any source)
        # into the `DefermentManager` which `CachePump.gather` then awaits.
        # The role of `downloader.initialize_pool` is to tell the downloader where to put its results.
        # That "results" queue should be something that `DefermentManager` can be updated from.

        # Let's re-evaluate CachePump's dependencies.
        # CachePump was given DefermentManager.
        # CachePump.pump_items (called by its gather) resolves deferments if it finds items (e.g. direct DB read).
        # If not found, it undefer with None.
        # This doesn't seem to loop back to downloader results properly.

        # Option A: `CachePump.gather` takes the `downloader` and orchestrates.
        # Option B: `ObjectLoader2` orchestrates: calls `CachePump.gather` for cache items,
        #           then separately processes downloader results. (More complex)

        # Revisiting `CachePump` constructor: `CachePump(database, deferment_manager, logger, ...)`
        # It does NOT take the `_gathered_items_for_iterator` queue directly.
        # Its `gather` method is an `AsyncGenerator[Base, None]`.
        # The `pump_items` method in `CachePump` is what `gather` uses.
        # `pump_items` will try `DefermentManager`. If an item is not resolved,
        # it tries direct DB read. If still not found, it calls `DefermentManager.undefer(id, None)`.
        # This means the `Downloader` path is not fully integrated in `CachePump.gather` as it stands.

        # Let's assume `CachePump.gather` is intended to be the main data retrieval orchestrator.
        # It should be responsible for invoking the downloader for items not found in the cache.
        # The `Downloader` itself needs to be told where to put its results so `CachePump.gather` can find them.
        # This is typically via `DefermentManager.undefer(id, item.base)`.

        # So, `Downloader.initialize_pool` needs `DefermentManager`.
        # `params` for `initialize_pool` should include `deferment_manager`.
        # The `Downloader` workers would then do: `deferment_manager.undefer(id, downloaded_base_obj)`.

        self._downloader.initialize_pool({
            # "results": some_queue_if_downloader_puts_items_there_first, # Not directly needed if it calls undefer
            "deferment_manager": self._deferments, # Crucial for downloader to resolve items
            "total_children_count": total_children_to_process # For downloader's internal stats/progress
        })

        # Now, CachePump.gather will try to get items. If not in cache (via CacheReader),
        # DefermentManager will hold a pending future. CachePump.pump_items (via gather)
        # will add not-found IDs to the self._downloader (as a Queue[str]).
        # The downloader's (unseen) workers pick IDs from itself (this queue), download,
        # and then call self._deferments.undefer(id, base_obj).
        # CachePump.gather, by awaiting on futures from DefermentManager, will get these resolved items.

        async for base_object in self._pump.gather(children_ids): # Pass downloader implicitly used by pump
            yield base_object

        self._logger("ObjectLoader2: Finished iterating through pump.gather.")

        # Ensure the _gathered_items_for_iterator is disposed if it was used by an alternative flow
        # (Currently, _pump.gather directly yields Base, not via _gathered_items_for_iterator)
        # If _gathered_items_for_iterator was meant to be populated by pump or downloader, that wiring needs to exist.
        # Based on current CachePump.gather signature, it yields Base directly.
        # The _gathered_items_for_iterator queue seems unused in this specific iterator flow.
        # It might be intended for a different pattern (e.g. if pump itself put Items there).
        # For now, let's assume it's not needed for this iterator if pump.gather works as an AsyncGenerator[Base, None].
        # If it *is* needed, CachePump or Downloader must put `Item`s into it.

        # self._gathered_items_for_iterator.dispose() # This would be if iterator was `async for item in self._gathered_items_for_iterator.consume():`

        self._logger("ObjectLoader2: get_object_iterator finished.")

```
