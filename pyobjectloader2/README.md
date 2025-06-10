# PyObjectLoader2

A Python implementation of the Speckle ObjectLoader2, designed for efficiently downloading and managing 3D object data.

This library provides tools to fetch Speckle objects, cache them (with support for in-memory and potentially other database backends), and provide them to applications, typically for 3D visualization or analysis. It's built with `asyncio` for concurrent operations.

## Features (Planned/Implemented)

*   Asynchronous object loading from various sources.
*   Caching mechanisms (in-memory, potentially IndexedDB-like for specific environments).
*   Concurrent processing of object data.
*   Helper utilities for managing object queues, batches, and deferments.

## Installation

Currently, this package is under development. Once released, you would typically install it via pip:

```bash
pip install pyobjectloader2
```

For development, clone the repository and install in editable mode:
```bash
git clone <repository-url>
cd pyobjectloader2
pip install -e .[dev]
```

## Basic Usage

```python
import asyncio
from pyobjectloader2.src import ObjectLoader2Factory, Base # Note: Direct import from src for example

async def main():
    # Example: Create an ObjectLoader2 from a list of simple objects
    # (In a real scenario, these objects would have more complex data)
    obj1_base = Base(id="obj1", speckle_type="MyObject", __closure__={"obj2": 1})
    obj2_base = Base(id="obj2", speckle_type="MyReferencedObject", __closure__={})

    objects_to_load = [obj1_base, obj2_base]

    # The factory helps set up the loader with in-memory components
    loader = ObjectLoader2Factory.create_from_objects(objects_to_load)

    # Accessing _root_id directly is for illustration; typically use public methods
    # print(f"Root object ID: {loader._root_id}")

    root_item = await loader.get_root_object_item()
    if root_item and root_item.base:
        print(f"Root object ID from getter: {root_item.base.id}")


    total_count = await loader.get_total_object_count()
    print(f"Total objects to load (including root): {total_count}")

    print("\nIterating through objects:")
    async for obj_base in loader.get_object_iterator():
        print(f"  Loaded object: ID={obj_base.id}, Type={obj_base.speckle_type}")
        if obj_base.id == "obj1":
            # Concurrently get a referenced object while iterating
            referenced_obj = await loader.get_object("obj2")
            if referenced_obj:
                 print(f"    Got referenced object via get_object: {referenced_obj.id}")
                 assert referenced_obj.id == "obj2"
            else:
                print("    Failed to get referenced object obj2 via get_object")


    await loader.dispose_async()

if __name__ == "__main__":
    asyncio.run(main())
```

## Development

*   Install dependencies: `pip install -e .[dev]`
*   Run tests: `pytest`
*   Run linters/formatters: `ruff check .` and `ruff format .` (if configured)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
