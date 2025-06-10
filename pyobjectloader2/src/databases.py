# pyobjectloader2/src/databases.py
import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from .interfaces import Database # From src/interfaces.py
from .types import Item, Base, CustomLogger # From src/types.py
from .options import MemoryDatabaseOptions # Import from new options file

# Default logger if none provided
def _default_logger(*args, **kwargs):
    print(*args, **kwargs)

class BaseDatabase(Database, ABC):
    _logger: CustomLogger

    def __init__(self, logger: Optional[CustomLogger] = None):
        self._logger = logger or _default_logger

    @abstractmethod
    async def get_all(self, keys: List[str]) -> List[Optional[Item]]:
        pass

    @abstractmethod
    async def cache_save_batch(self, params: Dict[str, List[Item]]) -> None:
        # The original TS used `params: { items: Item[] }`
        # For Python, more direct to pass `batch: List[Item]` or `items: List[Item]`
        # Let's assume the dict structure is `{'items': List[Item]}` for consistency with TS if CachePump sends that.
        # Or, if CachePump is Pythonic, it would send `items=List[Item]`.
        # The `CachePump._process_write_batch` currently does `await self.database.cache_save_batch({'items': items})`
        # So, this signature is Dict[str, List[Item]] where the key is "items".
        pass

    @abstractmethod
    async def dispose_async(self) -> None:
        pass

class IndexedDatabase(BaseDatabase):
    _indexed_db_factory: Optional[Any] # Actual IDBFactory like object
    _key_range: Optional[Any] # Actual KeyRange like object
    _db_name: str
    _object_store_name: str
    _db: Optional[Any] # Placeholder for the IDBDatabase instance (from browser/pyodide or a lib)

    def __init__(self, params: Dict[str, Any]): # Corresponds to a subset of ObjectLoader2FactoryOptions + logger
        super().__init__(params.get("logger"))
        self._indexed_db_factory = params.get("indexed_db")
        self._key_range = params.get("key_range")
        self._db_name = "speckle_objectloader_db"  # Default name
        self._object_store_name = "objects"       # Default store name
        self._db = None
        self._logger("IndexedDatabase stub initialized.")
        if not self._indexed_db_factory or not self._key_range:
            self._logger("IndexedDatabase: Warning - indexed_db factory or key_range utility not provided. Operations will fail.")
        # Note: Actual IndexedDB setup (opening DB, creating object stores) is async and event-driven.
        # This stub doesn't implement that. A real version would need an async __init__ or separate open() method.

    async def _ensure_db_open(self) -> bool:
        """
        Placeholder for ensuring the IndexedDB is open.
        In a real scenario, this would involve async operations and event handling.
        e.g. using `aioindexeddb` or JS interop.
        Returns True if DB is considered open, False otherwise.
        """
        if self._db:
            return True
        if not self._indexed_db_factory:
            self._logger("IndexedDatabase: Cannot open database, no IDBFactory provided.")
            return False

        self._logger("IndexedDatabase: _ensure_db_open() called. Actual DB opening logic is not implemented in stub.")
        # --- Example of what it might look like with JS interop (e.g. Pyodide) ---
        # try:
        #   from js import indexedDB, IDBKeyRange # These would be JS objects via Pyodide
        #   if not self._indexed_db_factory: self._indexed_db_factory = indexedDB
        #   if not self._key_range: self._key_range = IDBKeyRange
        #
        #   open_request = self._indexed_db_factory.open(self._db_name, 1)
        #
        #   def onupgradeneeded(event):
        #       db = event.target.result
        #       if not db.objectStoreNames.contains(self._object_store_name):
        #           db.createObjectStore(self._object_store_name, keyPath="baseId")
        #
        #   open_request.onupgradeneeded = onupgradeneeded
        #
        #   # Convert JS Promise from open_request to Python awaitable
        #   # This requires a utility function request_to_future or similar.
        #   # For simplicity, we'll assume it's not truly async here in the stub.
        #   self._db = await _convert_idb_request_to_future(open_request)
        #   self._logger("IndexedDatabase: Database opened successfully (simulated).")
        #   return True
        # except Exception as e:
        #   self._logger(f"IndexedDatabase: Error opening database (simulated): {e}")
        #   self._db = None
        #   return False
        # For a stub, we'll just say it's not available.
        return False


    async def get_all(self, keys: List[str]) -> List[Optional[Item]]:
        self._logger(f"IndexedDatabase: get_all for {len(keys)} keys. Stub behavior: returns all None.")
        if not await self._ensure_db_open() or not self._db:
            self._logger("IndexedDatabase: DB not open, cannot get_all.")
            return [None] * len(keys)

        # --- Actual IndexedDB logic would be here ---
        # object_store = self._db.transaction(self._object_store_name, "readonly").objectStore(self._object_store_name)
        # results = []
        # for key in keys:
        #   request = object_store.get(key)
        #   try:
        #       item_dict = await _convert_idb_request_to_future(request) # Convert IDBRequest to awaitable
        #       if item_dict:
        #           # Assuming item_dict is like {'baseId': ..., 'base': {...}, 'size': ...}
        #           # Need to reconstruct Base and Item objects. This is non-trivial.
        #           # For simplicity, let's say it stores Item directly as dict.
        #           # This assumes Item and Base are serializable/deserializable.
        #           base_obj = Base(**item_dict['base']) # Simplified
        #           results.append(Item(baseId=item_dict['baseId'], base=base_obj, size=item_dict['size']))
        #       else:
        #           results.append(None)
        #   except Exception as e: # e.g. if key not found leads to error in some IDB libs
        #       self._logger(f"IndexedDatabase: Error getting key {key}: {e}")
        #       results.append(None)
        # return results
        return [None] * len(keys) # Stub return

    async def cache_save_batch(self, params: Dict[str, List[Item]]) -> None:
        # items_to_save = params["items"] # Corrected based on CachePump
        items_to_save = params.get("items", []) # Safer access
        if not items_to_save:
            self._logger("IndexedDatabase: cache_save_batch called with no items.")
            return

        self._logger(f"IndexedDatabase: cache_save_batch for {len(items_to_save)} items. Stub behavior: no actual save.")
        if not await self._ensure_db_open() or not self._db:
            self._logger("IndexedDatabase: DB not open, cannot save batch.")
            return

        # --- Actual IndexedDB logic would be here ---
        # tx = self._db.transaction(self._object_store_name, "readwrite")
        # object_store = tx.objectStore(self._object_store_name)
        # for item in items_to_save:
        #   # Item needs to be converted to a plain dict for storing in IndexedDB usually
        #   # This depends on whether the IDB lib handles dataclasses.
        #   # For example: item_dict = dataclasses.asdict(item)
        #   # However, Base inside Item is a class. Serialization needs care.
        #   # Assuming item is stored by its 'baseId' and is a dict or simple obj.
        #   object_store.put({'baseId': item.baseId, 'base': dataclasses.asdict(item.base), 'size': item.size}) # Simplified
        # try:
        #   await _convert_tx_to_future(tx) # Wait for transaction to complete
        #   self._logger(f"IndexedDatabase: Batch of {len(items_to_save)} items saved (simulated).")
        # except Exception as e:
        #   self._logger(f"IndexedDatabase: Error saving batch (simulated): {e}")
        pass


    async def dispose_async(self) -> None:
        self._logger("IndexedDatabase: dispose_async called")
        if self._db:
            # In real IndexedDB: self._db.close()
            self._logger("IndexedDatabase: Database closed (simulated).")
            self._db = None

class MemoryDatabase(BaseDatabase):
    _items: Dict[str, Item] # Stores Item objects, keyed by Base.id

    def __init__(self, options: MemoryDatabaseOptions):
        super().__init__(options.logger)
        self._items = {}
        if options.items: # options.items is Dict[str, Any], should be Dict[str, Base] or Dict[str, Item]
            for key, value in options.items.items():
                if isinstance(value, Item):
                    self._items[key] = value
                elif isinstance(value, Base): # If Base objects are provided, wrap them in Item
                    item_size = 0
                    try: item_size = len(str(value)) # Rough size
                    except: pass
                    self._items[key] = Item(baseId=value.id, base=value, size=item_size)
                else:
                    self._logger(f"MemoryDatabase: Item '{key}' has unknown type '{type(value)}', skipping.")
        self._logger(f"MemoryDatabase initialized with {len(self._items)} items.")


    async def get_all(self, keys: List[str]) -> List[Optional[Item]]:
        self._logger(f"MemoryDatabase: get_all for keys: {keys}")
        # Create a list of results, preserving order of keys
        # If key not found, corresponding item in list is None
        results = [self._items.get(key) for key in keys]
        return results

    async def cache_save_batch(self, params: Dict[str, List[Item]]) -> None:
        # items_to_save = params["items"]
        items_to_save = params.get("items", [])
        if not items_to_save:
            self._logger("MemoryDatabase: cache_save_batch called with no items.")
            return

        self._logger(f"MemoryDatabase: cache_save_batch for {len(items_to_save)} items.")
        for item_to_save in items_to_save:
            if not isinstance(item_to_save, Item):
                self._logger(f"MemoryDatabase: Attempted to save non-Item object: {type(item_to_save)}. Skipping.")
                continue
            self._items[item_to_save.baseId] = item_to_save

    async def dispose_async(self) -> None:
        self._logger("MemoryDatabase: dispose_async called.")
        # Optionally clear items:
        # self._items.clear()
        # self._logger("MemoryDatabase: In-memory store cleared.")
        pass # MemoryDatabase often doesn't need explicit resource cleanup beyond Python's GC
