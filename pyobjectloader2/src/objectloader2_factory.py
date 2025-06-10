# pyobjectloader2/src/objectloader2_factory.py
import json
from typing import List, Dict, Any, Optional

from .types import Base, CustomLogger, Item # Item needed for MemoryDatabase if it stores Items
from .databases import IndexedDatabase, MemoryDatabase
from .downloaders import MemoryDownloader, ServerDownloader
from .objectloader2 import ObjectLoader2 # The main class
from .options import (
    ObjectLoader2Options, MemoryDatabaseOptions, ObjectLoader2FactoryOptions,
    DefermentManagerOptions # If factory needs to configure DM globally
)
from .helpers import _default_logger # For default logger

class ObjectLoader2Factory:
    @staticmethod
    def create_from_objects(objects: List[Base], logger: Optional[CustomLogger] = None) -> ObjectLoader2:
        effective_logger = logger or _default_logger
        if not objects:
            effective_logger("ObjectLoader2Factory: Error - Cannot create ObjectLoader2 from empty list of objects.")
            raise ValueError("Cannot create ObjectLoader2 from empty list of objects")

        root_obj_of_list = objects[0] # Assuming the first object is the intended root for the loader

        # Prepare records for MemoryDatabase and MemoryDownloader
        # MemoryDatabaseOptions takes Dict[str, Any], where Any can be Base or Item.
        # MemoryDatabase constructor handles converting Base to Item.
        records_for_mem_db: Dict[str, Base] = {obj.id: obj for obj in objects}
        mem_db_options = MemoryDatabaseOptions(items=records_for_mem_db, logger=effective_logger)
        memory_db = MemoryDatabase(mem_db_options)

        # MemoryDownloader needs Dict[str, Base] for its records.
        memory_downloader = MemoryDownloader(
            root_id=root_obj_of_list.id,
            records=records_for_mem_db,
            logger=effective_logger
        )

        loader_options = ObjectLoader2Options(
            root_id=root_obj_of_list.id,
            database=memory_db,
            downloader=memory_downloader,
            logger=effective_logger
        )
        effective_logger(f"ObjectLoader2Factory: Created ObjectLoader2 from {len(objects)} objects. Root: {root_obj_of_list.id}")
        return ObjectLoader2(loader_options)

    @staticmethod
    def create_from_json(json_string: str, logger: Optional[CustomLogger] = None) -> ObjectLoader2:
        effective_logger = logger or _default_logger
        try:
            parsed_json_data: List[Dict[str, Any]] = json.loads(json_string)
        except json.JSONDecodeError as e:
            effective_logger(f"ObjectLoader2Factory: Error decoding JSON string - {e}")
            raise ValueError(f"Invalid JSON string provided: {e}")

        if not isinstance(parsed_json_data, list):
            effective_logger("ObjectLoader2Factory: Error - JSON string did not parse to a list.")
            raise ValueError("JSON string must represent a list of objects.")

        objects: List[Base] = []
        for i, obj_dict in enumerate(parsed_json_data):
            if not isinstance(obj_dict, dict):
                effective_logger(f"ObjectLoader2Factory: Error - Item at index {i} in JSON list is not an object/dict.")
                raise ValueError(f"JSON list item at index {i} must be an object.")
            try:
                # Basic validation for required fields
                if not all(k in obj_dict for k in ['id', 'speckle_type']):
                    effective_logger(f"ObjectLoader2Factory: Error - Object at index {i} missing 'id' or 'speckle_type'.")
                    raise ValueError(f"JSON object at index {i} must have 'id' and 'speckle_type'.")

                objects.append(Base(
                    id=obj_dict['id'],
                    speckle_type=obj_dict['speckle_type'],
                    # __closure__ is Optional[Dict[str, int]], defaults to empty dict if not present
                    __closure__=obj_dict.get('__closure__')
                ))
            except TypeError as e: # Catches errors if Base instantiation fails due to bad dict values
                effective_logger(f"ObjectLoader2Factory: Error creating Base object from dict at index {i} - {e}")
                raise ValueError(f"Invalid object structure in JSON at index {i}: {e}")

        effective_logger(f"ObjectLoader2Factory: Parsed {len(objects)} objects from JSON string.")
        return ObjectLoader2Factory.create_from_objects(objects, effective_logger)

    @staticmethod
    def create_from_url(
        server_url: str,
        stream_id: str,
        object_id: str, # This is the root_id for ObjectLoader2
        token: Optional[str] = None,
        additional_headers: Optional[Dict[str, str]] = None, # Renamed from 'headers' to avoid conflict with any 'Headers' type
        factory_options: Optional[ObjectLoader2FactoryOptions] = None # Renamed from 'options'
    ) -> ObjectLoader2:

        current_factory_options = factory_options or ObjectLoader2FactoryOptions()
        effective_logger = current_factory_options.logger or _default_logger

        downloader_params = {
            "serverUrl": server_url,
            "streamId": stream_id,
            "objectId": object_id,
            "token": token,
            "headers": additional_headers, # Pass the renamed headers dict
            "logger": effective_logger
        }
        server_downloader = ServerDownloader(downloader_params)

        database: Database
        if current_factory_options.use_memory_cache:
            database = MemoryDatabase(MemoryDatabaseOptions(logger=effective_logger, items={})) # Start with empty memory DB
            effective_logger("ObjectLoader2Factory: Using MemoryDatabase for URL-based loader.")
        else:
            # For IndexedDatabase, factory_options should provide indexed_db and key_range utilities
            indexed_db_params = {
                "logger": effective_logger,
                "indexed_db": current_factory_options.indexed_db, # This is Any, could be JS object from Pyodide
                "key_range": current_factory_options.key_range     # This is Any, could be JS object from Pyodide
            }
            database = IndexedDatabase(indexed_db_params)
            effective_logger("ObjectLoader2Factory: Using IndexedDatabase (stub) for URL-based loader.")
            if not current_factory_options.indexed_db or not current_factory_options.key_range:
                effective_logger("ObjectLoader2Factory: Warning - IndexedDB utilities not provided in factory options. IndexedDatabase may not function.")


        loader_options = ObjectLoader2Options(
            root_id=object_id,
            downloader=server_downloader,
            database=database,
            logger=effective_logger
        )
        effective_logger(f"ObjectLoader2Factory: Created ObjectLoader2 for URL. Root: {object_id}, Server: {server_url}")
        return ObjectLoader2(loader_options)

```
