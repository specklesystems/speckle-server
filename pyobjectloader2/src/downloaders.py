# pyobjectloader2/src/downloaders.py
import asyncio # Required for asyncio.QueueEmpty
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, List
from .interfaces import Downloader, Queue as BaseQueue # Renamed to BaseQueue to avoid conflict
from .types import Item, Base, CustomLogger

# Default logger if none provided
def _default_logger(*args, **kwargs):
    print(*args, **kwargs)

class BaseDownloader(Downloader, ABC): # Implementing the Downloader interface from interfaces.py
    _logger: CustomLogger # Make logger non-optional at BaseDownloader level for consistency

    def __init__(self, logger: Optional[CustomLogger] = None):
        self._logger = logger or _default_logger

    @abstractmethod
    def initialize_pool(self, params: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    async def download_single(self) -> Item: # This is specific to ObjectLoader2's root download
        pass

    @abstractmethod
    async def dispose_async(self) -> None:
        pass

    # Methods from Queue interface that Downloader extends
    @abstractmethod
    def add(self, item: str) -> None: # item should be string (id of not found object)
        pass

    @abstractmethod
    async def get(self) -> str: # item should be string (id for downloader to process)
        pass

    @abstractmethod
    def size(self) -> int:
        pass


class ServerDownloader(BaseDownloader):
    _server_url: str
    _stream_id: str
    _object_id: str # Root object ID, might be used if downloader needs to fetch it directly
    _token: Optional[str]
    _headers: Optional[Dict[str,str]]
    _queue: asyncio.Queue[str] # Internal queue for IDs to download

    def __init__(self, params: Dict[str, Any]): # params often come from factory options
        super().__init__(params.get("logger"))
        self._server_url = params["serverUrl"]
        self._stream_id = params["streamId"]
        # object_id in ServerDownloader is the root object id for context, not necessarily the only one it downloads
        self._object_id = params["objectId"]
        self._token = params.get("token")
        self._headers = params.get("headers")
        self._queue = asyncio.Queue()
        self._results_queue: Optional[BaseQueue[Item]] = None # Set in initialize_pool
        self._logger(f"ServerDownloader initialized for server {self._server_url}, stream {self._stream_id}, root obj {self._object_id}")

    def initialize_pool(self, params: Dict[str, Any]) -> None:
        self._logger("ServerDownloader: initialize_pool called")
        self._results_queue = params.get("results")
        if not self._results_queue:
            self._logger("ServerDownloader: Warning - results queue not provided in initialize_pool.")
        # TODO: Worker pool for actual HTTP downloads would be started here
        # For now, items added to self._queue will be processed by a placeholder in get() or download_single()
        # if those were to become part of a worker loop.
        # The current design from ObjectLoader2 implies downloader's Queue interface (add/get/size)
        # is for IDs of *not found items*. Then downloader's pool processes these IDs and puts *Items*
        # into the results_queue.
        pass

    async def download_single(self) -> Item:
        self._logger(f"ServerDownloader: download_single for root object {self._object_id}")
        # This method is for fetching the initial root object if not in DB.
        # Actual implementation would use an HTTP client (e.g. aiohttp)
        # For example:
        # async with aiohttp.ClientSession(headers=self._actual_headers) as session:
        #   async with session.get(f"{self._server_url}/objects/{self._stream_id}/{self._object_id}") as resp:
        #     if resp.status == 200:
        #       obj_data = await resp.json() # Assuming Base-like structure
        #       # Potentially need to reconstruct Base object and its __closure__
        #       base = Base(id=obj_data['id'], speckle_type=obj_data['speckle_type'], __closure__=obj_data.get('__closure__'))
        #       return Item(baseId=base.id, base=base)
        raise NotImplementedError("ServerDownloader.download_single is not implemented. Requires HTTP client.")

    async def dispose_async(self) -> None:
        self._logger("ServerDownloader: dispose_async called")
        # TODO: Cleanup for worker pool and HTTP sessions
        # Signal workers to stop, clear queue by repeatedly calling get_nowait
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
                self._queue.task_done()
            except asyncio.QueueEmpty:
                break
        pass

    def add(self, item_id: str) -> None: # id of object to download
        self._logger(f"ServerDownloader: add called with ID {item_id}")
        self._queue.put_nowait(item_id) # Assuming this is called by CachePump for notFoundItems

    async def get(self) -> str: # Consumed by the downloader's worker pool
        self._logger("ServerDownloader: get called (downloader's worker wants an ID to process)")
        # This 'get' is for the downloader's internal workers to pick up IDs.
        # In a real scenario, a worker task would call this, then perform the HTTP GET,
        # then put the resulting Item into self._results_queue.
        # For a stub, we can raise if empty or simulate a block.
        # If this is called directly without a worker pool, it's less meaningful.
        try:
            return await self._queue.get() # Workers would await this
        except asyncio.CancelledError:
            self._logger("ServerDownloader: get cancelled.")
            raise

    def size(self) -> int:
        q_size = self._queue.qsize()
        self._logger(f"ServerDownloader: size called, current queue size: {q_size}")
        return q_size


class MemoryDownloader(BaseDownloader):
    _root_id: str
    _records: Dict[str, Base] # All available objects
    _id_queue: asyncio.Queue[str] # Queue for IDs to "download"
    _results_queue: Optional[BaseQueue[Item]] # Set in initialize_pool

    def __init__(self, root_id: str, records: Dict[str, Base], logger: Optional[CustomLogger] = None):
        super().__init__(logger)
        self._root_id = root_id
        self._records = records
        self._id_queue = asyncio.Queue()
        self._results_queue = None
        self._logger("MemoryDownloader initialized")

    def initialize_pool(self, params: Dict[str, Any]) -> None:
        self._logger("MemoryDownloader: initialize_pool called")
        self._results_queue = params.get("results")
        if not self._results_queue:
            self._logger("MemoryDownloader: Warning - results queue not provided.")
        # For MemoryDownloader, we can simulate processing queued items immediately
        # or have a "worker" task do it if we want to test async behavior.
        # If `add` directly puts to results_queue, then initialize_pool might not need to start workers.
        # Let's assume `add` will handle putting to results queue if it's available.
        pass

    async def download_single(self) -> Item:
        self._logger(f"MemoryDownloader: download_single for root {self._root_id}")
        base_obj = self._records.get(self._root_id)
        if not base_obj:
            self._logger(f"MemoryDownloader: Root object {self._root_id} not found in records!")
            raise ValueError(f"Root object {self._root_id} not found in MemoryDownloader records")

        # Estimate size (very rough)
        obj_str_len = 0
        try:
            obj_str_len = len(str(base_obj))
        except Exception:
            pass # Ignore if str() fails

        return Item(baseId=base_obj.id, base=base_obj, size=obj_str_len)

    async def dispose_async(self) -> None:
        self._logger("MemoryDownloader: dispose_async called")
        while not self._id_queue.empty():
            try:
                self._id_queue.get_nowait()
                self._id_queue.task_done()
            except asyncio.QueueEmpty:
                break
        pass

    def add(self, item_id: str) -> None: # id of object to "download"
        self._logger(f"MemoryDownloader: add called with ID {item_id}")
        self._id_queue.put_nowait(item_id) # Add to internal queue

        # Simulate processing and putting to results queue if available
        # This makes MemoryDownloader behave more like a real downloader for testing ObjectLoader2
        if self._results_queue:
            base_obj = self._records.get(item_id)
            if base_obj:
                obj_str_len = 0
                try: obj_str_len = len(str(base_obj))
                except Exception: pass
                item_obj = Item(baseId=base_obj.id, base=base_obj, size=obj_str_len)
                self._results_queue.add(item_obj) # Add to the shared results queue
                self._logger(f"MemoryDownloader: Item {item_id} processed and added to results_queue.")
                # We should consume from _id_queue here if processing is "done"
                # However, typical Queue usage means a worker calls `get()` then processes.
                # For simplicity in `add` for MemoryDownloader, if results_queue is present,
                # we "process" it. The `get` method below would then be for a scenario
                # where `add` doesn't immediately process.
                # To avoid double processing or confusion, let's assume `add` is the producer,
                # and something else (a worker, or a direct call to a processing method) uses `get`.
                # The provided ObjectLoader2 code makes CachePump.gather call downloader.add for notFoundItems.
                # Then initializePool is called on downloader, which gets the results queue.
                # Then downloader's internal mechanism is expected to pick up IDs (via its `get`)
                # and put `Item`s into the `results` queue.
                # So, `add` should just queue the ID. A separate worker task (not implemented here)
                # would call `self.get()`, fetch from `self._records`, and put to `self._results_queue`.
                # For the stub, to make it work without explicit workers, the current `add` behavior of
                # directly pushing to `_results_queue` is a shortcut.
                # Let's refine: `add` queues the ID. `get` (if called by a conceptual worker) would process.
                # To make the stub testable with ObjectLoader2 as written, the shortcut in `add` is needed.
            else:
                self._logger(f"MemoryDownloader: ID {item_id} not found in records during add.")
        else:
            self._logger(f"MemoryDownloader: No results_queue, ID {item_id} is queued internally.")


    async def get(self) -> str: # Consuming from the queue of IDs to download
        # This would be called by a worker in a real downloader.
        self._logger("MemoryDownloader: get called (worker asking for ID to process)")
        try:
            item_id = await self._id_queue.get()
            # If a worker called this, it would then:
            # 1. Fetch from self._records using item_id
            # 2. Construct an Item
            # 3. Put Item into self._results_queue
            # self._id_queue.task_done() would be called by the worker.
            # Since this stub might not have explicit workers, this get is more of a placeholder.
            return item_id
        except asyncio.CancelledError:
            self._logger("MemoryDownloader: get cancelled.")
            raise


    def size(self) -> int:
        s = self._id_queue.qsize()
        self._logger(f"MemoryDownloader: size is {s}")
        return s
