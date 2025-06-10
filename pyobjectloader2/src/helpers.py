import asyncio
import time
from abc import ABC, abstractmethod
from typing import Any, Callable, Coroutine, Dict, List, Optional, TypeVar, Generic, AsyncGenerator, Set, Tuple

from .types import Base, Item, CustomLogger, Reference, is_base, is_reference, ObjectLoaderRuntimeError, ObjectLoaderConfigurationError
from .interfaces import Queue as BaseQueue, Downloader, Database # Renamed Queue to BaseQueue to avoid conflict with internal Queue implementations

T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')

# Default logger if none provided
def _default_logger(*args, **kwargs):
    print(*args, **kwargs)

class AggregateQueue(BaseQueue[T]):
    """
    A queue that aggregates two other queues.
    Adding an item to this queue will add it to both underlying queues.
    """
    def __init__(self, queue1: BaseQueue[T], queue2: BaseQueue[T]):
        if not queue1 or not queue2:
            raise ObjectLoaderConfigurationError("AggregateQueue requires two valid queue instances.")
        self._queue1 = queue1
        self._queue2 = queue2

    def add(self, item: T) -> None:
        self._queue1.add(item)
        self._queue2.add(item)

    async def get(self) -> T:
        # This behavior might need clarification.
        # For now, it attempts to get from the first queue, then the second if the first is empty or raises an error.
        # Or, it might be intended that `get` is not supported, or that it should return from a specific queue.
        # The original TypeScript version's `values()` method is also not directly translatable without more context.
        try:
            return await self._queue1.get()
        except (NotImplementedError, asyncio.QueueEmpty, Exception): # Catching general Exception is broad
            try:
                return await self._queue2.get()
            except (NotImplementedError, asyncio.QueueEmpty, Exception) as e:
                raise ObjectLoaderRuntimeError(f"Could not get item from either queue in AggregateQueue: {e}")


    def size(self) -> int:
        # The concept of 'size' for an aggregate queue can be ambiguous.
        # Summing sizes, averaging, or taking min/max are all possibilities.
        # Here, we sum them, assuming items are distinct or managed by underlying queues.
        return self._queue1.size() + self._queue2.size()

    # The `values` method from TypeScript which yields values is more akin to an async generator.
    # However, without knowing the exact intended use of `values()` (e.g., all values from both, interleaved, etc.),
    # it's hard to provide a direct equivalent that fits Python's typical async patterns.
    # If it's meant to be a snapshot, that's one thing; if it's a continuous stream, that's another.
    # For now, raising NotImplementedError is safer.
    async def values(self) -> AsyncGenerator[T, None]:
        # This is a placeholder. A proper implementation would need to define
        # how values from two queues are merged or iterated.
        # Example: yield from self._queue1.values() followed by self._queue2.values()
        # or some form of merging if that's intended.
        raise NotImplementedError("The 'values' method for AggregateQueue needs specific merging logic.")
        yield # Make it an async generator


class AsyncGeneratorQueue(Generic[T]):
    """
    A queue that allows multiple consumers to await items pushed by producers.
    Items are buffered if no consumers are waiting.
    Consumers use an async generator interface (`consume`).
    """
    def __init__(self, name: str = "AsyncGeneratorQueue"):
        self._buffer: List[T] = []
        self._waiters: List[asyncio.Future[T]] = []
        self._finished = False
        self._name = name # For debugging or logging
        self._lock = asyncio.Lock()

    async def add(self, item: T) -> None:
        """Adds an item to the queue. If a consumer is waiting, it's woken up."""
        if self._finished:
            # Optionally raise an error or log a warning
            # print(f"Warning: Item added to finished AsyncGeneratorQueue '{self._name}'")
            return

        async with self._lock:
            if self._waiters:
                waiter = self._waiters.pop(0)
                # Ensure the future is not already done, which can happen in rare edge cases or if set_result is called elsewhere.
                if not waiter.done():
                    waiter.set_result(item)
                else:
                    # This case means the waiter was somehow cancelled or already resolved.
                    # We should probably put the item back or log this unexpected state.
                    # For simplicity now, we'll just add to buffer if this happens.
                    self._buffer.append(item)
            else:
                self._buffer.append(item)

    async def consume(self) -> AsyncGenerator[T, None]:
        """
        Async generator that yields items from the queue.
        Waits if the queue is empty until an item is added or the queue is disposed.
        """
        while not self._finished:
            async with self._lock:
                if self._buffer:
                    yield self._buffer.pop(0)
                    continue # Check buffer again before potentially waiting

                # If buffer is empty and we are finished, exit loop
                if self._finished and not self._buffer:
                    break

            # If still here, buffer was empty (or became empty) and not finished, so wait for an item
            future: asyncio.Future[T] = asyncio.Future()
            async with self._lock:
                # Check buffer again after acquiring lock, in case item was added while waiting for lock
                if self._buffer:
                    yield self._buffer.pop(0)
                    continue
                if self._finished and not self._buffer: # Check finished state again
                    break
                self._waiters.append(future)

            try:
                # Wait for the future to be resolved by `add` or cancelled by `dispose`
                item_to_yield = await future
                yield item_to_yield
            except asyncio.CancelledError:
                # This can happen if `dispose` cancels the future.
                # The loop condition `not self._finished` should handle exiting.
                break # Exit consumer loop if cancelled
            finally:
                # Ensure future is removed if it's still in waiters (e.g. if await future raised something else)
                async with self._lock:
                    if future in self._waiters:
                        self._waiters.remove(future)


        # After finishing, yield any remaining items in the buffer
        async with self._lock:
            while self._buffer:
                yield self._buffer.pop(0)


    async def dispose(self) -> None:
        """Signals that no more items will be added and wakes up any waiting consumers."""
        if self._finished:
            return

        async with self._lock:
            self._finished = True
            # Cancel all waiting futures to unblock consumers
            for waiter in self._waiters:
                if not waiter.done():
                    waiter.cancel("AsyncGeneratorQueue disposed")
            self._waiters.clear()

    def is_finished(self) -> bool:
        return self._finished

    def qsize(self) -> int:
        """Returns the approximate number of items in the buffer (not including waiters)."""
        return len(self._buffer)

    def waiters_count(self) -> int:
        """Returns the number of consumers currently waiting for an item."""
        return len(self._waiters)

class KeyedQueue(Generic[K, V]):
    """
    A queue that stores items with keys, maintaining insertion order.
    Allows splicing (removing a range of items).
    """
    def __init__(self):
        self._map: Dict[K, V] = {}
        self._order: List[K] = [] # Stores keys to maintain order

    def enqueue(self, key: K, value: V) -> bool:
        """Adds an item with a key. Returns True if the key is new, False otherwise."""
        is_new = key not in self._map
        if is_new:
            self._order.append(key)
        self._map[key] = value
        return is_new

    def get(self, key: K) -> Optional[V]:
        """Retrieves an item by its key."""
        return self._map.get(key)

    def has(self, key: K) -> bool:
        """Checks if a key exists in the queue."""
        return key in self._map

    def size(self) -> int:
        """Returns the number of items in the queue."""
        return len(self._order)

    def splice_values(self, start: int, delete_count: int) -> List[V]:
        """
        Removes a range of items from the queue and returns them.
        Items are identified by their order of insertion.
        """
        if start < 0:
            start = 0
        if start >= len(self._order):
            return []

        keys_to_remove = self._order[start : start + delete_count]
        removed_values: List[V] = []

        for key in keys_to_remove:
            if key in self._map:
                removed_values.append(self._map.pop(key))

        # Efficiently remove keys from _order
        # If removing from the beginning, slicing is efficient
        if start == 0:
            self._order = self._order[delete_count:]
        else:
            # For removals not at the start, list comprehension or careful slicing needed
            # This approach reconstructs the list minus the removed keys
            # A more direct in-place modification might be: del self._order[start : start + delete_count]
            # However, ensuring consistency if keys_to_remove has duplicates or non-sequential items
            # (though _order shouldn't have duplicate keys) is important.
            # The current keys_to_remove is a slice, so it's sequential.
            del self._order[start : start + delete_count]

        return removed_values

    def get_all_values_and_clear(self) -> List[V]:
        """Returns all values in order and clears the queue."""
        values = [self._map[key] for key in self._order if key in self._map]
        self._map.clear()
        self._order.clear()
        return values

    def get_first_n_values(self, count: int) -> List[V]:
        """Returns the first N values without removing them."""
        keys_to_get = self._order[:count]
        return [self._map[key] for key in keys_to_get if key in self._map]

    def get_ordered_keys(self) -> List[K]:
        """Returns a copy of the keys in their insertion order."""
        return list(self._order)

# Placeholder for Pump ABC if it's not in interfaces.py (it should be)
# from .interfaces import Pump as BasePump

class Pump(ABC):
    """Abstract base class for all pumps."""

    @abstractmethod
    async def add(self, obj: Base) -> bool:
        """Adds a base object to the pump's processing queue."""
        pass

    @abstractmethod
    def is_disposed(self) -> bool:
        """Returns True if the pump has been disposed."""
        pass

    @abstractmethod
    async def dispose_async(self) -> None:
        """Disposes of the pump and its resources."""
        pass

    @abstractmethod
    def pump_items(self) -> AsyncGenerator[Tuple[Optional[List[Base]], Optional[List[str]]], None]:
        """
        Core logic for the pump.
        Yields tuples of (found_items, not_found_ids).
        """
        pass

    @abstractmethod
    def gather(self) -> AsyncGenerator[Base, None]:
        """
        Gathers processed items from the pump.
        Typically involves coordinating `pump_items` and any deferment mechanisms.
        """
        pass

class DeferredBase:
    """
    Manages a promise-like object (asyncio.Future) for a Base Speckle object
    that is expected to be resolved later, typically by a cache or downloader.
    """
    def __init__(self, base_id: str, manager: 'DefermentManager', ttl_ms: float = 5 * 60 * 1000): # 5 minutes default TTL
        self.id: str = base_id
        self._manager: 'DefermentManager' = manager # Keep a reference to the manager
        self.created_at: float = time.perf_counter() * 1000  # ms
        self.expires_at: float = self.created_at + ttl_ms
        self.ttl_ms: float = ttl_ms
        self._future: asyncio.Future[Optional[Base]] = asyncio.Future()
        self.accessed_at: float = self.created_at

    def get_id(self) -> str:
        return self.id

    async def get_item(self) -> Optional[Base]:
        """Awaits the future for the Base object."""
        try:
            return await self._future
        except asyncio.CancelledError:
            # If the future is cancelled (e.g., during manager disposal),
            # it's cleaner to return None or raise a specific error.
            return None

    def get_promise(self) -> asyncio.Future[Optional[Base]]:
        """Returns the underlying asyncio.Future."""
        return self._future

    def is_expired(self) -> bool:
        """Checks if the deferment has passed its TTL."""
        return time.perf_counter() * 1000 > self.expires_at

    def set_access(self) -> None:
        """Updates the last accessed time."""
        self.accessed_at = time.perf_counter() * 1000

    def found(self, item: Optional[Base]) -> None:
        """Resolves the future with the found item."""
        if not self._future.done():
            self._future.set_result(item)
        # No explicit 'done' call on manager here, manager handles cleanup

    def done(self) -> None:
        """
        Signals that this deferment is complete, usually by resolving with None
        if not already resolved. This can be used to unblock awaiters if the item
        is ultimately not found or processing is otherwise finished.
        """
        if not self._future.done():
            self._future.set_result(None) # Resolve with None if not found

    def cancel(self) -> None:
        """Cancels the future if it's not already done."""
        if not self._future.done():
            self._future.cancel()

class DefermentManager:
    """
    Manages DeferredBase instances, handling their creation, retrieval,
    and cleanup (e.g., due to TTL expiration or size limits).
    """
    DEFAULT_MAX_SIZE = 50000  # Default max number of deferments
    DEFAULT_CLEANUP_INTERVAL_MS = 30 * 1000  # Default cleanup check interval (30s)
    DEFAULT_DEFERMENT_TTL_MS = 5 * 60 * 1000 # Default TTL for a deferment (5min)

    def __init__(self,
                 max_size: int = DEFAULT_MAX_SIZE,
                 cleanup_interval_ms: float = DEFAULT_CLEANUP_INTERVAL_MS,
                 default_ttl_ms: float = DEFAULT_DEFERMENT_TTL_MS,
                 logger: CustomLogger = _default_logger):
        self.max_size = max_size
        self.cleanup_interval_ms = cleanup_interval_ms
        self.default_ttl_ms = default_ttl_ms
        self.logger = logger

        self._deferments: Dict[str, DeferredBase] = {}
        self._disposed: bool = False
        self._total_deferment_requests: int = 0 # For stats/logging
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock() # To protect access to _deferments

        self._start_cleanup_task()

    def _start_cleanup_task(self) -> None:
        """Starts the background task for periodic cleanup of deferments."""
        if self._cleanup_task and not self._cleanup_task.done():
            return # Task already running
        self._cleanup_task = asyncio.create_task(self._deferment_cleanup_loop())
        self.logger(f"DefermentManager: Cleanup task started. Interval: {self.cleanup_interval_ms / 1000}s, Max size: {self.max_size}")

    async def _deferment_cleanup_loop(self) -> None:
        """Periodically cleans expired or oversized deferment collections."""
        while not self._disposed:
            try:
                await asyncio.sleep(self.cleanup_interval_ms / 1000)
                if self._disposed: break # Exit if disposed during sleep
                await self._clean_deferments()
            except asyncio.CancelledError:
                self.logger("DefermentManager: Cleanup task cancelled.")
                break
            except Exception as e:
                self.logger(f"DefermentManager: Error in cleanup loop: {e}")
                # Potentially add a shorter sleep here to prevent rapid error logging if the error is persistent

    async def _clean_deferments(self) -> None:
        """
        Cleans deferments based on TTL and max size.
        Prioritizes removing expired items first, then oldest accessed if size exceeds max.
        """
        async with self._lock:
            now = time.perf_counter() * 1000
            keys_to_remove: List[str] = []

            # Phase 1: Remove expired deferments
            for key, deferred_item in self._deferments.items():
                if deferred_item.is_expired() or deferred_item.get_promise().done():
                    keys_to_remove.append(key)
                    if not deferred_item.get_promise().done():
                        deferred_item.done() # Resolve with None if expired and not already resolved

            for key in keys_to_remove:
                del self._deferments[key]

            self.logger(f"DefermentManager: Cleaned {len(keys_to_remove)} expired/done deferments. Current size: {len(self._deferments)}")

            # Phase 2: If still over max_size, remove oldest accessed (LRU-like)
            if len(self._deferments) > self.max_size:
                num_to_evict = len(self._deferments) - self.max_size
                self.logger(f"DefermentManager: Over size limit ({len(self._deferments)} > {self.max_size}). Evicting {num_to_evict} items.")

                # Sort by accessed_at (oldest first)
                sorted_by_access = sorted(self._deferments.items(), key=lambda item: item[1].accessed_at)

                eviction_candidates = sorted_by_access[:num_to_evict]
                for key, deferred_item_to_evict in eviction_candidates:
                    if not deferred_item_to_evict.get_promise().done():
                        # It's important to resolve these so awaiters aren't stuck indefinitely
                        deferred_item_to_evict.done() # Resolve with None
                    del self._deferments[key]
                self.logger(f"DefermentManager: Evicted {len(eviction_candidates)} items due to size limit. Current size: {len(self._deferments)}")


    async def is_deferred(self, base_id: str) -> bool:
        """Checks if a base_id has an active deferment."""
        async with self._lock:
            return base_id in self._deferments

    async def get(self, base_id: str) -> Optional[DeferredBase]:
        """
        Gets an existing DeferredBase item. Updates its access time.
        Returns None if not found.
        """
        async with self._lock:
            item = self._deferments.get(base_id)
            if item:
                if item.is_expired() or item.get_promise().done():
                    # Item is stale, remove it and return None
                    del self._deferments[base_id]
                    if not item.get_promise().done():
                        item.done() # Ensure it's resolved
                    return None
                item.set_access()
            return item

    async def defer(self, base_id: str, ttl_ms: Optional[float] = None) -> DeferredBase:
        """
        Creates or retrieves a DeferredBase for a given ID.
        If it exists and is not expired, returns the existing one.
        Otherwise, creates a new one.
        """
        self._total_deferment_requests += 1
        effective_ttl = ttl_ms if ttl_ms is not None else self.default_ttl_ms

        async with self._lock:
            existing_item = self._deferments.get(base_id)
            if existing_item:
                if existing_item.is_expired() or existing_item.get_promise().done():
                    # Stale, remove before creating a new one
                    if not existing_item.get_promise().done():
                        existing_item.done() # Resolve old one
                    del self._deferments[base_id]
                else:
                    existing_item.set_access() # Mark as accessed
                    return existing_item # Return existing, non-expired item

            # Create a new deferment
            new_item = DeferredBase(base_id, self, ttl_ms=effective_ttl)
            self._deferments[base_id] = new_item

            # Potential immediate cleanup if over size limit after adding
            # This is a simple check; more sophisticated strategies might be needed
            if len(self._deferments) > self.max_size * 1.1: # Add a small buffer to avoid constant aggressive cleaning
                # Schedule a cleanup soon, but don't await it here to keep `defer` responsive
                asyncio.create_task(self._clean_deferments())
                self.logger(f"DefermentManager: Size ({len(self._deferments)}) exceeded threshold after deferring {base_id}. Scheduled cleanup.")


            return new_item

    async def undefer(self, base_id: str, item: Optional[Base]) -> None:
        """Resolves the DeferredBase associated with base_id with the provided item."""
        async with self._lock:
            deferred_item = self._deferments.get(base_id)
            if deferred_item:
                deferred_item.found(item)
                # Optionally remove from deferments immediately after resolution,
                # or let cleanup handle it. For now, let cleanup handle it.
                # If item is None, it means it wasn't found, but the deferment is still resolved.
            # else:
                # self.logger(f"DefermentManager: Undefer called for non-existent/expired ID: {base_id}")


    async def track_deferment_request(self, count: int = 1) -> None: # Added async as other methods are
        """Increments the total deferment request counter."""
        self._total_deferment_requests += count

    @property
    def current_size(self) -> int:
        """Returns the current number of active deferments."""
        return len(self._deferments)

    @property
    def total_requests(self) -> int:
        """Total number of times deferments were requested (since manager instantiation)."""
        return self._total_deferment_requests

    async def dispose(self) -> None:
        """Disposes of the manager, cleaning up resources and stopping background tasks."""
        if self._disposed:
            return
        self.logger("DefermentManager: Disposing...")
        self._disposed = True

        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                self.logger("DefermentManager: Cleanup task successfully cancelled during dispose.")
            except Exception as e:
                self.logger(f"DefermentManager: Error waiting for cleanup task during dispose: {e}")
            self._cleanup_task = None

        async with self._lock:
            for key, deferred_item in self._deferments.items():
                if not deferred_item.get_promise().done():
                    deferred_item.cancel() # Cancel pending futures
            self._deferments.clear()
        self.logger("DefermentManager: Disposed. All deferments cleared.")

class BufferQueue(BaseQueue[T]):
    """
    A simple in-memory queue that stores items in a list.
    Does not block on add or get if empty (get returns None or raises).
    """
    def __init__(self):
        self._items: List[T] = []
        self._lock = asyncio.Lock() # Though methods are not async, lock for potential future async use / safety

    def add(self, item: T) -> None:
        # Not async, but lock for consistency if other methods become async
        # For a purely sync version, lock might be overkill unless accessed by multiple threads (not asyncio tasks)
        # Given the context of other async components, using a lock is safer.
        # async with self._lock: # If this method were async
        self._items.append(item)

    async def get(self) -> T: # Made async to align with BaseQueue, but doesn't block
        # async with self._lock: # If operations need atomicity
        if self._items:
            return self._items.pop(0)
        raise asyncio.QueueEmpty("BufferQueue is empty") # Or return None, depending on desired contract

    def size(self) -> int:
        # async with self._lock:
        return len(self._items)

    def get_all_values_and_clear(self) -> List[T]:
        """Returns all items currently in the queue and empties the queue."""
        # async with self._lock:
        items_snapshot = list(self._items)
        self._items.clear()
        return items_snapshot

# BatchedPool, BatchingQueue, CacheReader, CachePump, MemoryPump are more complex
# and will be added in subsequent steps. This initial set provides foundational elements.
# For now, adding placeholders for them to avoid import errors if other modules expect them.

class BatchedPool(Generic[T]):
    """
    Manages a pool of asynchronous workers to process items in batches.
    Items are added to an internal queue and workers pick them up in batches.
    """

    DEFAULT_CONCURRENCY = 1
    DEFAULT_MAX_BATCH_SIZE = 100
    DEFAULT_BATCH_TIMEOUT_MS = 50  # Time to wait for a batch to fill

    def __init__(self,
                 process_batch_fn: Callable[[List[T]], Coroutine[Any, Any, None]],
                 concurrency: int = DEFAULT_CONCURRENCY,
                 max_batch_size: int = DEFAULT_MAX_BATCH_SIZE,
                 batch_timeout_ms: float = DEFAULT_BATCH_TIMEOUT_MS,
                 logger: CustomLogger = _default_logger):
        if concurrency <= 0:
            raise ObjectLoaderConfigurationError("Concurrency must be positive.")
        if max_batch_size <= 0:
            raise ObjectLoaderConfigurationError("Max batch size must be positive.")
        if batch_timeout_ms <= 0:
            raise ObjectLoaderConfigurationError("Batch timeout must be positive.")

        self.process_batch_fn = process_batch_fn
        self.concurrency = concurrency
        self.max_batch_size = max_batch_size
        self.batch_timeout_ms = batch_timeout_ms / 1000 # Convert to seconds for asyncio.sleep
        self.logger = logger

        self._item_queue: asyncio.Queue[T] = asyncio.Queue()
        self._workers: List[asyncio.Task] = []
        self._is_disposing = False
        self._loop_task: Optional[asyncio.Task] = None
        self._active_workers = 0
        self._workers_finished_event = asyncio.Event() # To signal all workers have completed after disposal

    async def add(self, item: T) -> None:
        """Adds an item to the processing queue."""
        if self._is_disposing:
            self.logger("BatchedPool: Attempted to add item while disposing. Item ignored.")
            return
        await self._item_queue.put(item)

    async def _get_batch(self) -> List[T]:
        """
        Retrieves a batch of items from the queue.
        Waits for `batch_timeout_ms` for the batch to fill up to `max_batch_size`.
        Returns an empty list if the pool is disposing and the queue is empty.
        """
        batch: List[T] = []
        try:
            # Wait for the first item with a timeout
            first_item = await asyncio.wait_for(self._item_queue.get(), timeout=self.batch_timeout_ms)
            batch.append(first_item)
            self._item_queue.task_done()
        except asyncio.TimeoutError:
            return [] # No items received within timeout
        except asyncio.QueueEmpty: # Should ideally be caught by timeout, but good for robustness
             return []
        except Exception as e: # Catch other potential errors from queue.get() if any
            if self._is_disposing: return [] # if disposing, this could be expected
            self.logger(f"BatchedPool: Error getting first item for batch: {e}")
            return []


        # Try to fill the rest of the batch without further waiting for each item
        while len(batch) < self.max_batch_size:
            try:
                item = self._item_queue.get_nowait()
                batch.append(item)
                self._item_queue.task_done()
            except asyncio.QueueEmpty:
                break # Queue is empty, batch is as full as it can be for now
        return batch

    async def _worker(self, worker_id: int) -> None:
        """A worker task that continuously fetches batches and processes them."""
        self.logger(f"BatchedPool: Worker {worker_id} started.")
        self._active_workers +=1
        try:
            while not self._is_disposing or self._item_queue.qsize() > 0: # Process remaining items during disposal
                if self._is_disposing and self._item_queue.empty():
                    break

                batch = await self._get_batch()
                if batch:
                    try:
                        await self.process_batch_fn(batch)
                    except Exception as e:
                        self.logger(f"BatchedPool: Worker {worker_id}: Error processing batch: {e}")
                        # Optionally, implement retry logic or error handling for specific items in batch
                elif not self._is_disposing: # batch is empty, not disposing
                    # If _get_batch returns empty list due to timeout, worker should continue to try fetching
                    # This can happen if queue is empty for batch_timeout_ms
                    # No specific sleep needed here as _get_batch has timeout
                    pass
                elif self._is_disposing: # batch is empty and disposing
                    break # Exit if disposing and no items were fetched

        except asyncio.CancelledError:
            self.logger(f"BatchedPool: Worker {worker_id} cancelled.")
        except Exception as e:
            self.logger(f"BatchedPool: Worker {worker_id} encountered unexpected error: {e}")
        finally:
            self._active_workers -=1
            self.logger(f"BatchedPool: Worker {worker_id} finished. Active: {self._active_workers}")
            if self._active_workers == 0 and self._is_disposing:
                self._workers_finished_event.set()


    def start(self) -> None:
        """Starts the worker pool if not already started."""
        if self._loop_task and not self._loop_task.done():
            self.logger("BatchedPool: Workers already started.")
            return

        self.logger(f"BatchedPool: Starting {self.concurrency} workers...")
        self._is_disposing = False # Reset dispose flag if restarting
        self._workers_finished_event.clear()
        self._workers.clear()
        for i in range(self.concurrency):
            task = asyncio.create_task(self._worker(i))
            self._workers.append(task)
        # Create a task that represents the lifecycle of all workers
        # This is useful if something needs to await the completion of the entire pool
        # For now, managing workers individually in dispose_async.
        # self._loop_task = asyncio.gather(*self._workers, return_exceptions=True) # Or handle exceptions per worker

    async def dispose_async(self) -> None:
        """Signals workers to stop, waits for them to finish processing, and cleans up."""
        if self._is_disposing:
            self.logger("BatchedPool: Already disposing.")
            # Wait for workers to finish if dispose_async is called multiple times
            if self._active_workers > 0:
                 await self._workers_finished_event.wait()
            return

        self.logger("BatchedPool: Disposing...")
        self._is_disposing = True

        # Unblock any workers stuck in self._item_queue.get() by putting sentinel values or closing queue
        # A robust way is to signal and then potentially cancel tasks if they don't exit.
        # For asyncio.Queue, there isn't a 'close' that consumers see immediately.
        # Workers check self._is_disposing flag. If a worker is awaiting self._item_queue.get(),
        # it will continue to wait until an item is available or its timeout in _get_batch expires.
        # If batch_timeout_ms is long, this might delay shutdown.
        # Consider adding sentinel items if faster shutdown is critical:
        # for _ in range(self.concurrency): await self._item_queue.put(None) # Assuming process_batch_fn handles None

        if not self._workers: # Not started or already disposed and workers cleared
             self.logger("BatchedPool: No workers to dispose.")
             self._workers_finished_event.set() # Ensure event is set if no workers
             return

        # Wait for all workers to complete
        if self._active_workers > 0:
            self.logger(f"BatchedPool: Waiting for {self._active_workers} active workers to finish...")
            try:
                await asyncio.wait_for(self._workers_finished_event.wait(), timeout=self.concurrency * self.batch_timeout_ms + 5) # Generous timeout
            except asyncio.TimeoutError:
                self.logger("BatchedPool: Timeout waiting for workers to finish. Forcing cancellation.")
                for task in self._workers:
                    if not task.done():
                        task.cancel()

        # Final gather to collect any exceptions from worker tasks if not handled before
        # This is important if tasks were cancelled.
        await asyncio.gather(*self._workers, return_exceptions=True)

        self.logger("BatchedPool: All workers finished.")
        self._workers.clear()
        # Clear the queue of any remaining items after workers are done
        while not self._item_queue.empty():
            self._item_queue.get_nowait()
            self._item_queue.task_done()
        self.logger("BatchedPool: Disposed.")

    def qsize(self) -> int:
        """Returns the current number of items in the input queue."""
        return self._item_queue.qsize()

    def is_active(self) -> bool:
        """Checks if the pool has active workers or items to process."""
        return self._active_workers > 0 or not self._item_queue.empty()

class BatchingQueue(Generic[K, V]):
    """
    A queue that collects items and processes them in batches.
    Batches are triggered by size, or by a maximum wait time.
    It uses a KeyedQueue internally to store items before they are batched.
    """
    DEFAULT_MAX_BATCH_SIZE = 100
    DEFAULT_MAX_WAIT_TIME_MS = 100  # Max time to wait before processing a batch, even if not full
    MIN_WAIT_TIME_MS = 10           # Min time to wait, provides a floor for processing interval
    MAX_WAIT_TIME_MULTIPLIER = 10   # Multiplier for max_wait_time_ms to cap adaptive wait time

    def __init__(self,
                 process_batch_fn: Callable[[List[V]], Coroutine[Any, Any, None]],
                 max_batch_size: int = DEFAULT_MAX_BATCH_SIZE,
                 max_wait_time_ms: float = DEFAULT_MAX_WAIT_TIME_MS,
                 logger: CustomLogger = _default_logger):
        if max_batch_size <= 0:
            raise ObjectLoaderConfigurationError("Max batch size must be positive.")
        if max_wait_time_ms <= 0:
            raise ObjectLoaderConfigurationError("Max wait time must be positive.")

        self.process_batch_fn = process_batch_fn
        self.max_batch_size = max_batch_size
        self.max_wait_time_ms = max_wait_time_ms
        self.logger = logger

        self._keyed_queue = KeyedQueue[K, V]()
        self._is_disposed = False
        self._loop_task: Optional[asyncio.Task] = None
        self._current_wait_time_ms = max_wait_time_ms  # Adaptive wait time
        self._items_processed_since_last_log = 0 # For logging batch processing stats
        self._last_log_time = time.perf_counter() # For logging batch processing stats
        self._loop_iteration_lock = asyncio.Lock() # Ensures only one _loop iteration runs at a time

    def start(self) -> None:
        """Starts the batch processing loop if not already started."""
        if self._loop_task and not self._loop_task.done():
            self.logger("BatchingQueue: Loop already started.")
            return
        self._is_disposed = False # Reset if restarting
        self._loop_task = asyncio.create_task(self._loop())
        self.logger(f"BatchingQueue: Started. Max batch size: {self.max_batch_size}, Max wait: {self.max_wait_time_ms}ms")

    async def _loop(self) -> None:
        """The main loop that periodically checks and processes batches."""
        self.logger("BatchingQueue: Processing loop initiated.")
        while not self._is_disposed:
            loop_start_time = time.perf_counter()
            batch_processed_this_iteration = False

            async with self._loop_iteration_lock: # Ensure only one iteration at a time
                if self._is_disposed: break

                batch = self._get_batch_if_ready()

                if batch:
                    batch_size = len(batch)
                    self.logger(f"BatchingQueue: Processing batch of {batch_size} items.")
                    batch_process_start_time = time.perf_counter()
                    try:
                        await self.process_batch_fn(batch)
                        self._items_processed_since_last_log += batch_size
                        batch_processed_this_iteration = True
                    except Exception as e:
                        self.logger(f"BatchingQueue: Error processing batch: {e}")

                    batch_process_duration_ms = (time.perf_counter() - batch_process_start_time) * 1000
                    self.logger(f"BatchingQueue: Batch processed in {batch_process_duration_ms:.2f}ms.")

                    # Adaptive wait time adjustment
                    # If processing takes long, increase wait time; if queue is large, decrease it.
                    if batch_process_duration_ms > self.max_wait_time_ms / 2:
                        self._current_wait_time_ms = min(
                            self._current_wait_time_ms * 1.5,
                            self.max_wait_time_ms * self.MAX_WAIT_TIME_MULTIPLIER
                        )
                    elif self._keyed_queue.size() > self.max_batch_size * 2: # If queue is much larger than batch size
                        self._current_wait_time_ms = max(
                            self.MIN_WAIT_TIME_MS,
                            self._current_wait_time_ms / 1.5
                        )
                    else: # Gradually revert to max_wait_time_ms if things are stable
                         self._current_wait_time_ms = (self._current_wait_time_ms + self.max_wait_time_ms) / 2


                    self._current_wait_time_ms = max(self.MIN_WAIT_TIME_MS, self._current_wait_time_ms)
                    self.logger(f"BatchingQueue: Next check in {self._current_wait_time_ms:.2f}ms. Queue size: {self.count()}")

            # Logging periodic stats
            current_time = time.perf_counter()
            if current_time - self._last_log_time > 30: # Log every 30 seconds
                items_per_sec = self._items_processed_since_last_log / (current_time - self._last_log_time)
                self.logger(f"BatchingQueue: Stats: ~{items_per_sec:.2f} items/sec. Current queue: {self.count()}. Wait time: {self._current_wait_time_ms:.2f}ms")
                self._items_processed_since_last_log = 0
                self._last_log_time = current_time

            # Determine sleep duration
            # If a batch was processed, we might want a shorter sleep or no sleep to immediately check again
            # For now, always sleep based on _current_wait_time_ms to prevent busy-looping if batches are small/fast
            # The sleep should be outside the lock to allow `add` to acquire it.

            # Calculate how much of the wait time has already passed in this iteration
            iteration_duration_ms = (time.perf_counter() - loop_start_time) * 1000
            sleep_duration_s = max(0, (self._current_wait_time_ms - iteration_duration_ms) / 1000)

            if not self._is_disposed:
                try:
                    await asyncio.sleep(sleep_duration_s)
                except asyncio.CancelledError:
                    self.logger("BatchingQueue: Loop sleep cancelled.")
                    break # Exit loop if cancelled

        self.logger("BatchingQueue: Processing loop stopped.")

    def _get_batch_if_ready(self) -> List[V]:
        """
        Returns a batch of items if the queue size reaches `max_batch_size`.
        This method is called by the internal loop, which also handles time-based batching.
        The original TypeScript logic for time-based batching was tied to the loop's interval.
        Here, the loop itself runs based on `_current_wait_time_ms`, so any call to this implies
        that enough time has passed, or we are checking due to size.
        """
        # This method is called by _loop. The _loop itself respects _current_wait_time_ms.
        # So, if _loop calls this, it implies either enough time has passed,
        # or it's checking proactively. We primarily batch on size here.
        # The time-based batching is implicitly handled by the loop's sleep duration.
        if self._keyed_queue.size() >= self.max_batch_size:
            return self._keyed_queue.splice_values(0, self.max_batch_size)
        # If not disposing, and the loop is called (meaning timer might have expired),
        # take all items if any. This ensures items don't sit indefinitely if below batch size.
        # This condition means: if the loop is triggered by its timer (not by filling up to max_batch_size),
        # then process whatever is in the queue.
        if self._keyed_queue.size() > 0: # Process any items if loop is triggered by timer
             return self._keyed_queue.get_all_values_and_clear()
        return []


    def add(self, key: K, value: V) -> None:
        """Adds an item to the queue. If the queue reaches max_batch_size, it might trigger processing sooner."""
        if self._is_disposed:
            self.logger("BatchingQueue: Attempted to add item while disposing. Item ignored.")
            return

        # The lock here is important if `_loop` is also trying to modify `_keyed_queue` (e.g. `splice_values`)
        # However, `_get_batch_if_ready` and its subsequent processing happen inside `_loop_iteration_lock`
        # So, direct calls to _keyed_queue methods here should be safe without an additional lock,
        # as long as `_keyed_queue` itself is thread/task-safe for its internal operations if needed.
        # KeyedQueue is currently not explicitly async-locked, but its operations are simple.
        # For utmost safety, especially if KeyedQueue methods were complex and async:
        # async with self._loop_iteration_lock: # Or a dedicated lock for _keyed_queue
        #    is_new = self._keyed_queue.enqueue(key, value)

        is_new = self._keyed_queue.enqueue(key, value)
        # self.logger(f"BatchingQueue: Item added. Key: {key}. New: {is_new}. Queue size: {self.count()}")

        # Optional: Proactive check if adding this item fills a batch, to make the loop react faster.
        # However, the loop runs on its own timer (_current_wait_time_ms).
        # If _current_wait_time_ms is very short, this isn't strictly necessary.
        # If it can be long, and we want immediate processing on batch full, this could be useful.
        # For now, rely on the loop's timing.
        # if self._keyed_queue.size() >= self.max_batch_size and self._loop_task and not self._loop_iteration_lock.locked():
        #    # This is tricky: trying to wake up the loop or force an iteration.
        #    # Could cancel the current sleep in _loop, or use an asyncio.Event.
        #    # For simplicity, let the loop's natural timing handle it.
        #    pass


    async def get(self, key: K) -> Optional[V]:
        """Retrieves an item by its key from the internal KeyedQueue."""
        # async with self._loop_iteration_lock: # If KeyedQueue access needs to be synced with loop's modifications
        return self._keyed_queue.get(key)

    def count(self) -> int:
        """Returns the number of items currently in the queue."""
        return self._keyed_queue.size()

    def is_disposed(self) -> bool:
        return self._is_disposed

    async def dispose_async(self) -> None:
        """Signals the queue to stop processing and cleans up resources."""
        if self._is_disposed:
            self.logger("BatchingQueue: Already disposing.")
            return

        self.logger("BatchingQueue: Disposing...")
        self._is_disposed = True

        if self._loop_task:
            # Attempt to acquire the lock to ensure any ongoing _loop iteration completes.
            # This helps make sure that a batch isn't halfway through processing when we cancel.
            async with self._loop_iteration_lock:
                self.logger("BatchingQueue: Loop iteration lock acquired during dispose.")
                if not self._loop_task.done():
                    self._loop_task.cancel()

            try:
                await self._loop_task
            except asyncio.CancelledError:
                self.logger("BatchingQueue: Processing loop task successfully cancelled.")
            except Exception as e: # Should not happen if cancellation is handled in _loop
                self.logger(f"BatchingQueue: Error waiting for loop task during dispose: {e}")
            self._loop_task = None

        # Process any remaining items after the loop has stopped
        self.logger("BatchingQueue: Processing remaining items after loop stop...")
        # Acquire lock one last time to safely access _keyed_queue
        async with self._loop_iteration_lock:
            remaining_items = self._keyed_queue.get_all_values_and_clear()
            if remaining_items:
                self.logger(f"BatchingQueue: Processing final batch of {len(remaining_items)} items.")
                try:
                    await self.process_batch_fn(remaining_items)
                except Exception as e:
                    self.logger(f"BatchingQueue: Error processing final batch: {e}")
            else:
                self.logger("BatchingQueue: No remaining items to process.")

        self.logger("BatchingQueue: Disposed.")

class CacheReader:
    """
    Manages reading objects from a database cache.
    It uses a BatchingQueue to batch requests to the database
    and a DefermentManager to handle objects that are requested but not yet loaded.
    """
    DEFAULT_BATCH_SIZE = 100
    DEFAULT_BATCH_WAIT_TIME_MS = 20

    def __init__(self,
                 database: Database,
                 deferment_manager: DefermentManager,
                 logger: CustomLogger = _default_logger,
                 batch_size: int = DEFAULT_BATCH_SIZE,
                 batch_wait_time_ms: float = DEFAULT_BATCH_WAIT_TIME_MS):
        if not database:
            raise ObjectLoaderConfigurationError("CacheReader requires a Database instance.")
        if not deferment_manager:
            raise ObjectLoaderConfigurationError("CacheReader requires a DefermentManager instance.")

        self.database = database
        self.deferment_manager = deferment_manager
        self.logger = logger
        self._is_disposed = False

        self._read_queue = BatchingQueue[str, str]( # Key: object ID, Value: object ID
            process_batch_fn=self._process_batch,
            max_batch_size=batch_size,
            max_wait_time_ms=batch_wait_time_ms,
            logger=self.logger
        )
        self._read_queue.start()
        self.logger("CacheReader: Initialized and read queue started.")

    async def _process_batch(self, ids: List[str]) -> None:
        """Callback for BatchingQueue to process a batch of object IDs to read from the database."""
        if self._is_disposed:
            self.logger("CacheReader: _process_batch called while disposed. Skipping.")
            return

        self.logger(f"CacheReader: Processing batch of {len(ids)} IDs from database.")
        unique_ids = list(set(ids)) # Ensure unique IDs, BatchingQueue might send duplicates if added multiple times

        try:
            # The `Item` type from types.py includes `base: Base` and `baseId: str`.
            # `database.get_all` is expected to return List[Optional[Item]]
            cached_items_with_optional: List[Optional[Item]] = await self.database.get_all(unique_ids)

            found_count = 0
            for i, object_id in enumerate(unique_ids):
                item_wrapper = cached_items_with_optional[i]
                if item_wrapper and item_wrapper.base:
                    # We have the Item wrapper, now undefer with the actual Base object
                    await self.deferment_manager.undefer(object_id, item_wrapper.base)
                    found_count += 1
                else:
                    # Item not found in cache or Item.base is None, resolve deferment with None
                    await self.deferment_manager.undefer(object_id, None)

            self.logger(f"CacheReader: Batch processed. Found {found_count}/{len(unique_ids)} items in database.")

        except Exception as e:
            self.logger(f"CacheReader: Error reading batch from database: {e}")
            # If database read fails, we should probably undefer all requested IDs with None
            # to prevent indefinite waiting.
            for object_id in unique_ids:
                await self.deferment_manager.undefer(object_id, None)


    async def get_object(self, obj_id: str) -> Optional[Base]:
        """
        Retrieves an object by its ID.
        If the object is already deferred and not resolved, it returns the existing promise.
        Otherwise, it defers the object and adds it to the read queue.
        """
        if self._is_disposed:
            self.logger("CacheReader: get_object called while disposed.")
            # Or raise error: raise ObjectLoaderRuntimeError("CacheReader is disposed")
            return None

        existing_deferment = await self.deferment_manager.get(obj_id)
        if existing_deferment:
            if not existing_deferment.get_promise().done():
                self.logger(f"CacheReader: Object {obj_id} already deferred. Returning existing promise.")
                return await existing_deferment.get_item() # Await the existing future
            else: # It's done, check if it was successful
                resolved_item = await existing_deferment.get_item()
                if resolved_item: # Successfully resolved previously
                    self.logger(f"CacheReader: Object {obj_id} was already resolved. Returning item.")
                    return resolved_item
                # Else, it was resolved with None (not found), so we might want to try reading again
                # or just return None. For now, let's assume if it resolved to None, it's "not found".
                # To force a re-read, we would need to remove the old deferment or create a new one.
                # For simplicity, if it was resolved to None, we'll defer again.
                self.logger(f"CacheReader: Object {obj_id} was resolved as None. Re-deferring.")


        # Defer the object (or re-defer if it resolved to None previously)
        new_deferment = await self.deferment_manager.defer(obj_id)

        # Add to read queue only if the new_deferment's promise is not already done
        # (which it shouldn't be for a freshly created one from defer unless defer itself resolved it)
        if not new_deferment.get_promise().done():
             self._read_queue.add(obj_id, obj_id) # Key and Value are both obj_id
             self.logger(f"CacheReader: Object {obj_id} deferred and added to read queue.")

        return await new_deferment.get_item()


    async def get_all(self, keys: List[str]) -> List[Optional[Item]]:
        """
        Directly calls the database's get_all method.
        This bypasses the deferment manager and BatchingQueue for direct access if needed.
        Consider if this should also interact with deferment manager. For now, it's a direct pass-through.
        """
        if self._is_disposed:
            self.logger("CacheReader: get_all called while disposed.")
            return [None] * len(keys)
        self.logger(f"CacheReader: Directly calling database.get_all for {len(keys)} keys.")
        return await self.database.get_all(keys)

    async def dispose_async(self) -> None:
        """Disposes of the CacheReader, including its BatchingQueue."""
        if self._is_disposed:
            self.logger("CacheReader: Already disposed.")
            return

        self.logger("CacheReader: Disposing...")
        self._is_disposed = True

        if self._read_queue:
            await self._read_queue.dispose_async()
            self.logger("CacheReader: Read queue disposed.")

        # DefermentManager is managed externally, so CacheReader should not dispose it.
        # Database is also managed externally.

        self.logger("CacheReader: Disposed.")

    def is_disposed(self) -> bool:
        return self._is_disposed

class CachePump(Pump):
    """
    Implements the Pump interface to manage data flow to/from a persistent cache (Database).
    It uses a BatchingQueue for writing items to the database and an AsyncGeneratorQueue
    for items that are gathered (found or not found). It interacts with a DefermentManager
    to resolve deferred objects.
    """
    DEFAULT_WRITE_BATCH_SIZE = 100
    DEFAULT_WRITE_BATCH_WAIT_TIME_MS = 500 # Longer wait time for writes is often acceptable
    DEFAULT_PUMP_READ_BATCH_SIZE = 100

    def __init__(self,
                 database: Database,
                 deferment_manager: DefermentManager,
                 logger: CustomLogger = _default_logger,
                 write_batch_size: int = DEFAULT_WRITE_BATCH_SIZE,
                 write_batch_wait_time_ms: float = DEFAULT_WRITE_BATCH_WAIT_TIME_MS,
                 pump_read_batch_size: int = DEFAULT_PUMP_READ_BATCH_SIZE):

        if not database:
            raise ObjectLoaderConfigurationError("CachePump requires a Database instance.")
        if not deferment_manager:
            raise ObjectLoaderConfigurationError("CachePump requires a DefermentManager instance.")

        self.database = database
        self.deferment_manager = deferment_manager
        self.logger = logger
        self._pump_read_batch_size = pump_read_batch_size
        self._is_disposed_flag = False # Using _is_disposed_flag to avoid name clash with method

        self._write_queue = BatchingQueue[str, Item]( # Key: object ID, Value: Item wrapper
            process_batch_fn=self._process_write_batch,
            max_batch_size=write_batch_size,
            max_wait_time_ms=write_batch_wait_time_ms,
            logger=self.logger
        )
        self._write_queue.start()

        # Queue for items that have been processed by pump_items (either found or confirmed not found)
        # The `gather` method will consume from this.
        self._gathered_items_queue = AsyncGeneratorQueue[Base]("CachePump_GatheredItems")

        # Used by pump_items to stage items before they are put into _gathered_items_queue
        self._found_items_buffer: List[Base] = []
        self._not_found_ids_buffer: List[str] = []


        self.logger("CachePump: Initialized. Write queue and gathered items queue started.")

    async def _process_write_batch(self, items: List[Item]) -> None:
        """Callback for BatchingQueue to write a batch of items to the database."""
        if self._is_disposed_flag:
            self.logger("CachePump: _process_write_batch called while disposed. Skipping.")
            return

        if not items:
            self.logger("CachePump: _process_write_batch called with empty list. Skipping.")
            return

        self.logger(f"CachePump: Writing batch of {len(items)} items to database.")
        try:
            # Database interface expects `cache_save_batch` to take a dictionary.
            # The original TypeScript code passes ` { items }`.
            await self.database.cache_save_batch({'items': items})
            self.logger(f"CachePump: Successfully wrote batch of {len(items)} items.")
        except Exception as e:
            self.logger(f"CachePump: Error writing batch to database: {e}")
            # TODO: Consider retry logic or how to handle failed writes.
            # For now, items that failed to write are effectively dropped from caching perspective.

    async def add(self, obj: Base) -> bool:
        """
        Adds a Base object to the pump's processing (write) queue.
        The object is wrapped in an Item structure for caching.
        Returns True, but operation is asynchronous.
        """
        if self._is_disposed_flag:
            self.logger("CachePump: add called while disposed. Item ignored.")
            return False # Or raise error

        if not is_base(obj):
            self.logger(f"CachePump: Attempted to add non-Base object: {type(obj)}. Item ignored.")
            return False

        # Wrap the Base object in an Item for storing in the database
        # Assuming 'size' is not critical here or can be calculated if needed by DB.
        item_to_cache = Item(baseId=obj.id, base=obj) # size can be optional

        self._write_queue.add(obj.id, item_to_cache)
        self.logger(f"CachePump: Object {obj.id} added to write queue.")
        return True # Indicates acceptance, not completion of write.

    def is_disposed(self) -> bool:
        return self._is_disposed_flag

    async def dispose_async(self) -> None:
        if self._is_disposed_flag:
            self.logger("CachePump: Already disposed.")
            return

        self.logger("CachePump: Disposing...")
        self._is_disposed_flag = True

        if self._write_queue:
            await self._write_queue.dispose_async()
            self.logger("CachePump: Write queue disposed.")

        if self._gathered_items_queue:
            await self._gathered_items_queue.dispose() # Signal consumers to stop
            self.logger("CachePump: Gathered items queue disposed.")

        # Database and DefermentManager are managed externally.
        self.logger("CachePump: Disposed.")

    async def pump_items(self, ids_iterable: List[str]) -> AsyncGenerator[Tuple[Optional[List[Base]], Optional[List[str]]], None]:
        """
        Core logic for the pump. Processes a list of IDs.
        Attempts to find them, potentially reads from DB if not immediately available.
        Yields tuples of (found_items_batch, not_found_ids_batch).
        This implementation will try to get from deferment manager first.
        If items are not found (resolved to None by deferment manager, possibly after CacheReader tried),
        this pump might re-fetch from DB directly as a last resort if CacheReader isn't used or failed.
        However, the typical flow implies CacheReader handles DB reads based on deferments.
        This `pump_items` will primarily be about managing the flow for `gather`.
        """
        if self._is_disposed_flag:
            self.logger("CachePump: pump_items called while disposed. Exiting.")
            yield None, None # Or raise error
            return

        ids_to_process = list(ids_iterable) # Make a mutable copy
        self.logger(f"CachePump: pump_items started for {len(ids_to_process)} IDs.")

        processed_ids_this_run: Set[str] = set()

        while ids_to_process:
            if self._is_disposed_flag: break

            batch_ids = ids_to_process[:self._pump_read_batch_size]
            ids_to_process = ids_to_process[self._pump_read_batch_size:]

            current_batch_found_items: List[Base] = []
            current_batch_not_found_ids: List[str] = []

            # Check deferment manager for these IDs
            for obj_id in batch_ids:
                if obj_id in processed_ids_this_run: continue # Avoid reprocessing in this run
                processed_ids_this_run.add(obj_id)

                deferment = await self.deferment_manager.get(obj_id)
                item: Optional[Base] = None
                if deferment:
                    item = await deferment.get_item() # This awaits resolution

                if item:
                    current_batch_found_items.append(item)
                    # Add to write queue as well, assuming if it's pumped, it should be persisted.
                    # This might be redundant if the item came from CacheReader which got it from DB.
                    # However, if it came from another source (e.g. direct add to DefermentManager), caching is good.
                    await self.add(item) # Ensure it's queued for writing
                else:
                    # Item not found via deferment (meaning CacheReader also likely failed if it was used)
                    # As a pump, we might try a direct DB read here as a last resort.
                    # This makes CachePump more robust if CacheReader isn't part of the setup,
                    # or if an item was missed by CacheReader.
                    self.logger(f"CachePump: Item {obj_id} not found via deferment. Attempting direct DB read.")
                    try:
                        # database.get_all expects list, returns list of Optional[Item]
                        db_item_wrapper_list = await self.database.get_all([obj_id])
                        if db_item_wrapper_list and db_item_wrapper_list[0] and db_item_wrapper_list[0].base:
                            db_item = db_item_wrapper_list[0].base
                            current_batch_found_items.append(db_item)
                            await self.deferment_manager.undefer(obj_id, db_item) # Ensure DM is updated
                            await self.add(db_item) # Add to write queue
                            self.logger(f"CachePump: Item {obj_id} found via direct DB read.")
                        else:
                            current_batch_not_found_ids.append(obj_id)
                            await self.deferment_manager.undefer(obj_id, None) # Confirm not found
                            self.logger(f"CachePump: Item {obj_id} NOT found via direct DB read.")
                    except Exception as e:
                        self.logger(f"CachePump: Error during direct DB read for {obj_id}: {e}")
                        current_batch_not_found_ids.append(obj_id)
                        await self.deferment_manager.undefer(obj_id, None) # Undefer with None on error

            if current_batch_found_items or current_batch_not_found_ids:
                # Add to internal buffers before pushing to _gathered_items_queue
                self._found_items_buffer.extend(current_batch_found_items)
                self._not_found_ids_buffer.extend(current_batch_not_found_ids)
                yield current_batch_found_items, current_batch_not_found_ids

            # Control write queue backpressure: if write queue is too large, pause pumping.
            # This is a simple backpressure mechanism.
            while self._write_queue.count() > self.DEFAULT_WRITE_BATCH_SIZE * 5 and not self._is_disposed_flag : # Arbitrary multiplier
                self.logger(f"CachePump: Write queue size ({self._write_queue.count()}) is large. Pausing pump_items.")
                await asyncio.sleep(1) # Wait for 1 second

        self.logger(f"CachePump: pump_items finished processing initial IDs.")
        # After loop, ensure any buffered items are yielded if needed, though current logic yields per batch.


    async def gather(self, ids_iterable: List[str]) -> AsyncGenerator[Base, None]:
        """
        Gathers processed items from the pump for the given IDs.
        It runs `pump_items` to ensure data is fetched/processed and then
        yields items from the `_gathered_items_queue` as they become available
        through the deferment mechanism.
        """
        if self._is_disposed_flag:
            self.logger("CachePump: gather called while disposed.")
            return

        # Create futures for all IDs we need to gather
        # These futures will be resolved by deferments.
        # `pump_items` (called next) will trigger the deferment resolutions.
        pending_futures: Dict[str, asyncio.Future[Optional[Base]]] = {}
        for obj_id in ids_iterable:
            # Defer ensures a future exists. If already deferred, we get the existing one.
            deferment = await self.deferment_manager.defer(obj_id)
            pending_futures[obj_id] = deferment.get_promise()

        # Start pump_items to process these IDs.
        # pump_items itself yields batches of (found, not_found), but its main role here
        # is to ensure items are processed through DefermentManager.
        # We don't directly consume the yield from pump_items here,
        # instead, we rely on DefermentManager resolving the futures.
        # The pump_items task can run in the background for these IDs.
        pump_task = asyncio.create_task(self._consume_pump_items(ids_iterable))

        # Now, await the futures we collected.
        # Iterate over a copy of keys, as we might modify dict if we re-check.
        for obj_id in list(pending_futures.keys()):
            if self._is_disposed_flag: break
            future = pending_futures[obj_id]
            try:
                # Wait for the individual future to complete.
                # A timeout can be added here if needed: await asyncio.wait_for(future, timeout=...)
                item = await future
                if item:
                    yield item
                # If item is None, it means it wasn't found. We just don't yield it.
            except asyncio.CancelledError:
                self.logger(f"CachePump: Future for {obj_id} cancelled during gather.")
                if self._is_disposed_flag: break # Stop if pump is disposed
            except Exception as e:
                self.logger(f"CachePump: Error awaiting future for {obj_id} in gather: {e}")

        # Ensure pump_task is awaited or cancelled to prevent orphaned tasks
        if not pump_task.done():
            pump_task.cancel()
        try:
            await pump_task # Wait for it to finish or acknowledge cancellation
        except asyncio.CancelledError:
            self.logger("CachePump: pump_items task for gather was cancelled.")

        self.logger("CachePump: gather completed.")

    async def _consume_pump_items(self, ids_iterable: List[str]):
        """Helper to run pump_items and consume its output, ensuring it runs to completion."""
        async for found_items, not_found_ids in self.pump_items(ids_iterable):
            # The primary purpose of pump_items in the context of gather is to ensure
            # deferments are resolved. The yielding of items here is secondary
            # as `gather` itself awaits on futures from DefermentManager.
            # However, logging or other actions could be done here.
            if found_items:
                self.logger(f"CachePump (_consume_pump_items): pump_items found {len(found_items)} items.")
            if not_found_ids:
                 self.logger(f"CachePump (_consume_pump_items): pump_items reported {len(not_found_ids)} not found IDs.")
            if self._is_disposed_flag:
                break
        self.logger("CachePump (_consume_pump_items): Finished consuming pump_items generator.")


class MemoryPump(Pump):
    """
    A simple implementation of the Pump interface that stores objects in memory.
    This is useful for scenarios where no external persistence is needed or for testing.
    """
    def __init__(self, logger: CustomLogger = _default_logger):
        self.logger = logger
        self._items: Dict[str, Base] = {}
        self._is_disposed_flag = False
        self._lock = asyncio.Lock() # To protect access to _items if methods become more complex

        self.logger("MemoryPump: Initialized.")

    async def add(self, obj: Base) -> bool:
        """Adds a Base object to the in-memory store."""
        if self._is_disposed_flag:
            self.logger("MemoryPump: add called while disposed. Item ignored.")
            return False

        if not is_base(obj):
            self.logger(f"MemoryPump: Attempted to add non-Base object: {type(obj)}. Item ignored.")
            return False

        async with self._lock:
            self._items[obj.id] = obj
        self.logger(f"MemoryPump: Object {obj.id} added to memory store. Total items: {len(self._items)}")
        return True

    def is_disposed(self) -> bool:
        return self._is_disposed_flag

    async def dispose_async(self) -> None:
        """Disposes of the MemoryPump. Clears the in-memory store."""
        if self._is_disposed_flag:
            self.logger("MemoryPump: Already disposed.")
            return

        self.logger("MemoryPump: Disposing...")
        self._is_disposed_flag = True
        async with self._lock:
            self._items.clear()
        self.logger("MemoryPump: Disposed. In-memory store cleared.")

    async def pump_items(self, ids_iterable: List[str]) -> AsyncGenerator[Tuple[Optional[List[Base]], Optional[List[str]]], None]:
        """
        Processes a list of IDs, retrieving them from the in-memory store.
        Yields a tuple containing a list of found items and a list of not-found IDs.
        In MemoryPump, this will typically be one batch as all lookups are instant.
        """
        if self._is_disposed_flag:
            self.logger("MemoryPump: pump_items called while disposed.")
            yield None, None
            return

        found_items: List[Base] = []
        not_found_ids: List[str] = []

        async with self._lock: # Ensure consistent view of _items during iteration
            for obj_id in ids_iterable:
                item = self._items.get(obj_id)
                if item:
                    found_items.append(item)
                else:
                    not_found_ids.append(obj_id)

        self.logger(f"MemoryPump: pump_items processed. Found: {len(found_items)}, Not found: {len(not_found_ids)}")
        yield found_items if found_items else None, not_found_ids if not_found_ids else None


    async def gather(self, ids_iterable: List[str]) -> AsyncGenerator[Base, None]:
        """
        Retrieves items specified by `ids_iterable` from the in-memory store.
        Items are yielded as they are found.
        """
        if self._is_disposed_flag:
            self.logger("MemoryPump: gather called while disposed.")
            return

        self.logger(f"MemoryPump: gather started for {len(ids_iterable)} IDs.")
        async with self._lock: # Lock during the gathering process for this simple sync store
            for obj_id in ids_iterable:
                if self._is_disposed_flag: break # Check disposal status within loop
                item = self._items.get(obj_id)
                if item:
                    yield item
        self.logger("MemoryPump: gather completed.")

# Clean up placeholder comments
# TODO: Implement BatchedPool -> Done
# TODO: Implement BatchingQueue -> Done
# TODO: Implement CacheReader -> Done
# TODO: Implement CachePump -> Done
# TODO: Implement MemoryPump -> Done

# End of initial file content
# print("helpers.py initial content created. Further classes will be added.") # Remove this line
print("helpers.py content updated with all specified classes.")
