# pyobjectloader2/tests/operations/test_objectloader2.py
import pytest
import json
import asyncio
from typing import List, Dict, Any

from pyobjectloader2.src.types import Base, Item
from pyobjectloader2.src.objectloader2 import ObjectLoader2
from pyobjectloader2.src.objectloader2_factory import ObjectLoader2Factory
from pyobjectloader2.src.options import ObjectLoader2Options, MemoryDatabaseOptions
from pyobjectloader2.src.downloaders import MemoryDownloader
from pyobjectloader2.src.databases import MemoryDatabase
from pyobjectloader2.src.helpers import _default_logger # Use the same default logger

# Basic logger for tests
# def test_logger(message: str, *args): # Using the default logger from helpers
# print(f"[TestLogger] {message}", *args)
test_logger = _default_logger

@pytest.mark.asyncio
async def test_can_get_root_object_from_cache(snapshot):
    root_id = 'baseId'
    root_base = Base(id='baseId', speckle_type='type', __closure__={})
    # MemoryDatabase now expects Dict[str, Any] where Any can be Base or Item.
    # Its constructor handles converting Base to Item.
    db_items_base = {root_id: root_base}
    database = MemoryDatabase(MemoryDatabaseOptions(items=db_items_base, logger=test_logger))

    # MemoryDownloader expects Dict[str, Base] for its records
    downloader_records = {root_id: root_base}
    downloader = MemoryDownloader(root_id, downloader_records, logger=test_logger)

    loader = ObjectLoader2(ObjectLoader2Options(
        root_id=root_id,
        downloader=downloader,
        database=database,
        logger=test_logger
    ))

    x_item = await loader.get_root_object_item()
    assert x_item is not None
    assert x_item.base is not None # Ensure base object exists within Item
    assert x_item.base.id == root_id
    snapshot.assert_match({"id": x_item.base.id, "speckle_type": x_item.base.speckle_type}, 'root_object_from_cache.json')
    await loader.dispose_async()

@pytest.mark.asyncio
async def test_can_get_root_object_from_downloader(snapshot):
    root_id = 'baseId'
    root_base = Base(id='baseId', speckle_type='type', __closure__={})
    downloader_records = {root_id: root_base} # Records for the downloader

    # Empty database, so it must come from downloader
    database = MemoryDatabase(MemoryDatabaseOptions(items={}, logger=test_logger))
    downloader = MemoryDownloader(root_id, downloader_records, logger=test_logger)

    loader = ObjectLoader2(ObjectLoader2Options(
        root_id=root_id,
        downloader=downloader,
        database=database,
        logger=test_logger
    ))
    x_item = await loader.get_root_object_item()
    assert x_item is not None
    assert x_item.base is not None
    assert x_item.base.id == root_id
    snapshot.assert_match({"id": x_item.base.id, "speckle_type": x_item.base.speckle_type}, 'root_object_from_downloader.json')
    await loader.dispose_async()

@pytest.mark.asyncio
async def test_can_get_single_object_from_cache_using_iterator(snapshot):
    root_id = 'baseId'
    root_base = Base(id='baseId', speckle_type='type', __closure__={})

    db_items_base = {root_id: root_base}
    database = MemoryDatabase(MemoryDatabaseOptions(items=db_items_base, logger=test_logger))

    downloader_records = {root_id: root_base}
    downloader = MemoryDownloader(root_id, downloader_records, logger=test_logger)

    loader = ObjectLoader2(ObjectLoader2Options(
        root_id=root_id,
        downloader=downloader,
        database=database,
        logger=test_logger
    ))

    r_bases: List[Base] = []
    async for x_base in loader.get_object_iterator():
        r_bases.append(x_base)

    assert len(r_bases) == 1
    assert r_bases[0].id == root_id
    snapshot.assert_match([{"id": item.id, "speckle_type": item.speckle_type} for item in r_bases], 'iterator_single_object.json')
    await loader.dispose_async()

@pytest.mark.asyncio
async def test_get_root_child_mem_cache_iterator_and_get_object(snapshot):
    child1_base = Base(id='child1Id', speckle_type='type', __closure__={})
    root_id = 'rootId'
    root_base = Base(id='rootId', speckle_type='type', __closure__={'child1Id': 100}) # type: ignore

    db_items_base = {
        root_id: root_base,
        child1_base.id: child1_base
    }
    database = MemoryDatabase(MemoryDatabaseOptions(items=db_items_base, logger=test_logger))

    downloader_records = {root_id: root_base, child1_base.id: child1_base}
    downloader = MemoryDownloader(root_id, downloader_records, logger=test_logger)

    loader = ObjectLoader2(ObjectLoader2Options(
        root_id=root_id,
        downloader=downloader,
        database=database,
        logger=test_logger
    ))

    r_iterator_items: List[Base] = []
    # Start get_object; it should use the deferment manager
    # get_object returns Optional[Base]
    obj_future = asyncio.create_task(loader.get_object(child1_base.id))

    async for x_base in loader.get_object_iterator():
        r_iterator_items.append(x_base)

    obj_from_get_object = await obj_future

    assert obj_from_get_object is not None
    assert obj_from_get_object.id == child1_base.id
    # Check that iterator returned both root and child
    iterator_ids = {b.id for b in r_iterator_items}
    assert root_id in iterator_ids
    assert child1_base.id in iterator_ids
    snapshot.assert_match(sorted([item.id for item in r_iterator_items]), 'iterator_root_child_mem_cache_ids.json')
    snapshot.assert_match({"id": obj_from_get_object.id}, 'get_object_child_mem_cache_id.json')
    await loader.dispose_async()

@pytest.mark.asyncio
async def test_create_from_json_and_iterate(snapshot):
    root_dict: Dict[str, Any] = { # Explicitly type hint complex dicts
      "id": "efeadaca70a85ae6d3acfc93a8b380db", "speckle_type": "SampleObjectBase2",
      "__closure__": {"0e61e61edee00404ec6e0f9f594bce24": 100, "f70738e3e3e593ac11099a6ed6b71154": 100}
    }
    list1_dict = {"id": "0e61e61edee00404ec6e0f9f594bce24", "speckle_type": "DataChunk"}
    list2_dict = {"id": "f70738e3e3e593ac11099a6ed6b71154", "speckle_type": "DataChunk"}

    full_json_str = json.dumps([root_dict, list1_dict, list2_dict])

    loader = ObjectLoader2Factory.create_from_json(full_json_str, logger=test_logger)

    r_iterator_items: List[Base] = []
    async for x_base in loader.get_object_iterator():
        r_iterator_items.append(x_base)

    iterator_ids = sorted([item.id for item in r_iterator_items])
    expected_ids = sorted([root_dict["id"], list1_dict["id"], list2_dict["id"]]) # type: ignore
    assert iterator_ids == expected_ids
    snapshot.assert_match(iterator_ids, 'create_from_json_iterator_ids.json')
    await loader.dispose_async()
