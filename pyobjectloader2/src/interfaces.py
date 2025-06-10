from abc import ABC, abstractmethod
from typing import Any, List, Optional

from .types import Item # Assuming types.py is in the same directory

class Queue(ABC):
    @abstractmethod
    def add(self, item: Any) -> None:
        pass

    @abstractmethod
    async def get(self) -> Any: # Making this async as it's often I/O bound
        pass

    @abstractmethod
    def size(self) -> int:
        pass

class Downloader(Queue, ABC):
    @abstractmethod
    def initialize_pool(self, params: dict) -> None: # Define params structure more clearly if possible
        pass

    @abstractmethod
    async def download_single(self) -> Item:
        pass

    @abstractmethod
    async def dispose_async(self) -> None:
        pass

class Database(ABC):
    @abstractmethod
    async def get_all(self, keys: List[str]) -> List[Optional[Item]]:
        pass

    @abstractmethod
    async def cache_save_batch(self, params: dict) -> None: # Define params structure more clearly
        pass

    @abstractmethod
    async def dispose_async(self) -> None:
        pass
