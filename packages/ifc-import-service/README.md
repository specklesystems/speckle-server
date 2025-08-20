# IFC File Importer

This package provides a microservice for importing IFC files in to Speckle.

It is a worker for the queuing system, built on Postgres.

It is intended to eventually replace the File Import Service.

## Developing

1. Install [uv](https://docs.astral.sh/uv)
1. Sync the project dependencies

    ```bash
    uv sync
    ```

1. Run the service

    ```bash
    uv run main.py
    ```
