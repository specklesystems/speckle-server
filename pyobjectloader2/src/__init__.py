# pyobjectloader2/src/__init__.py
from .types import Base, Item, Reference, DataChunk, CustomLogger # Assuming CustomLogger is defined in types
from .interfaces import Downloader, Database, Queue # Queue was defined in interfaces.py
from .options import (
    ObjectLoader2Options,
    CacheOptions,
    MemoryDatabaseOptions,
    DefermentManagerOptions,
    ObjectLoader2FactoryOptions,
    # Individual type aliases like IDBFactory, KeyRange, Headers are not typically exported unless widely used.
)
# Import helpers that might be useful externally, or specific components from them
# For now, keeping helpers internal unless specific ones are requested for export.
# from .helpers import DefermentManager, CacheReader, CachePump, etc.

# Core classes
from .objectloader2 import ObjectLoader2
from .objectloader2_factory import ObjectLoader2Factory

# Specific database/downloader implementations if they are meant to be user-selectable/replaceable
from .databases import MemoryDatabase, IndexedDatabase, BaseDatabase
from .downloaders import MemoryDownloader, ServerDownloader, BaseDownloader


__all__ = [
    # Core Functionality
    "ObjectLoader2",
    "ObjectLoader2Factory",

    # Data Types (from types.py)
    "Base",
    "Item",
    "Reference",
    "DataChunk",
    "CustomLogger",

    # Interfaces (from interfaces.py)
    "Downloader", # ABC for downloaders
    "Database",   # ABC for databases
    "Queue",      # ABC for queue implementations (used by Downloader)

    # Options (from options.py)
    "ObjectLoader2Options",
    "CacheOptions",
    "MemoryDatabaseOptions",
    "DefermentManagerOptions",
    "ObjectLoader2FactoryOptions",

    # Concrete Implementations (if users need to instantiate them directly)
    "MemoryDatabase",
    "IndexedDatabase", # Stub, but export for consistency
    "BaseDatabase",    # ABC for databases
    "MemoryDownloader",
    "ServerDownloader",# Stub, but export for consistency
    "BaseDownloader",  # ABC for downloaders
]
