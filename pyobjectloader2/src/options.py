# pyobjectloader2/src/options.py
from dataclasses import dataclass, field
from typing import Callable, Optional, Any, Dict, List, Protocol

# Forward declaration for IDBFactory and KeyRange if they are complex types
# For now, using Any. These would ideally be proper Protocols or ABCs.
IDBFactory = Any
KeyRange = Any
Headers = Any # Assuming this is a dict-like or custom object

CustomLogger = Callable[..., None]

# From packages/objectloader2/src/operations/interfaces.ts
# Need to ensure these are defined or imported if they are classes/protocols
# These are already in src/interfaces.py, so they will be imported from there
# by modules that need them. For options, it's okay to use Protocol for now
# if we don't want a direct import cycle with interfaces.py solely for type hints.
# However, it's generally better to import directly if they are stable.
# from .interfaces import Downloader, Database # Assuming direct import is fine

class Downloader(Protocol): # Basic Protocol stub for options typing
    async def dispose_async(self) -> None: ...
    def initialize_pool(self, params: dict) -> None: ...
    async def download_single(self) -> Any: ... # Should be Item
    def add(self, item: Any) -> None: ... # Should be str
    async def get(self) -> Any: ... # Should be str
    def size(self) -> int: ...


class Database(Protocol): # Basic Protocol stub for options typing
    async def get_all(self, keys: List[str]) -> List[Optional[Any]]: ... # Should be List[Optional[Item]]
    async def cache_save_batch(self, params: dict) -> None: ...
    async def dispose_async(self) -> None: ...


@dataclass
class ObjectLoader2Options:
    root_id: str
    downloader: Downloader # Actual Downloader instance
    database: Database   # Actual Database instance
    logger: Optional[CustomLogger] = None

@dataclass
class CacheOptions:
    # These fields were part of the original CacheReader/CachePump constructors.
    # Consolidating them here if they are meant to be user-configurable at a higher level.
    # If not, they can remain as constructor args in CacheReader/CachePump with defaults.
    # For now, assuming they are configurable options.
    max_cache_read_size: int = 10000 # Default from ObjectLoader2.ts
    max_cache_write_size: int = 10000 # Default from ObjectLoader2.ts
    max_cache_batch_write_wait: int = 3000 # in ms, default from ObjectLoader2.ts
    max_cache_batch_read_wait: int = 3000 # in ms, default from ObjectLoader2.ts
    max_write_queue_size: int = 40000 # Default from ObjectLoader2.ts
    logger: Optional[CustomLogger] = None

@dataclass
class MemoryDatabaseOptions:
    # items: Optional[Dict[str, Base]] = field(default_factory=dict) # Changed Base to Any for now, Item expected by MemoryDB
    items: Optional[Dict[str, Any]] = field(default_factory=dict)
    logger: Optional[CustomLogger] = None

@dataclass
class DefermentManagerOptions:
    # max_size_in_mb: int # Original TS used max_size (count) and cleanup_size_in_mb for actual memory
    # Python DefermentManager uses max_size (count) and default_ttl_ms
    # Let's stick to what Python's DefermentManager expects or adapt it.
    # For now, using the fields from the TS options for consistency if they are to be mapped.
    # The Python DefermentManager currently takes:
    # max_size: int, cleanup_interval_ms: float, default_ttl_ms: float
    # Let's map ttlms from TS to default_ttl_ms. max_size_in_mb is not directly used.
    max_size: int = 50000 # Default from Python's DefermentManager
    cleanup_interval_ms: float = 30 * 1000 # Default from Python's DefermentManager
    ttlms: int = 5 * 60 * 1000 # time-to-live in milliseconds, default from Python's DefermentManager
    logger: Optional[CustomLogger] = None


@dataclass
class ObjectLoader2FactoryOptions:
    use_memory_cache: bool = False
    key_range: Optional[KeyRange] = None
    indexed_db: Optional[IDBFactory] = None
    logger: Optional[CustomLogger] = None
