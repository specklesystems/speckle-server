# IFC File Importer

This package provides a microservice for importing IFC files in to Speckle.

The service was built to be run as a worker, as it will be constantly trying to pick up messages from the `backgroundjob` table specified in `FILEIMPORT_QUEUE_POSTGRES_URL`. Multiple instances of the service can be run in parallel, each instance will process a single job at a time. The queue is built over the concept of `SKIP FOR UPDATE` and transaction isolation levels to avoid race conditions.

## How it works

Once run the service will look for jobs, it will attempt to download the file and use `open_and_convert_file` from speckleifc to convert the file to a Speckle object. Once its finished, the service does three things:

1. uploads the file results to the specified speckle server in the job (using specklepy)
2. marks the message as completed/failed (in `backgroundjob`)
3. marks the file import process as completed (via a mutation).

Some files might cause the service to fail in a controlled or uncontrolled manner, thats why:

- attempt number must be incremented before the processing starts in case the processes does not finish. So if a message is picked up that had reached the maximum attempts, it must be marked as failed without trying to process it.
- if a message in a `processing` state reaches the timeout, it can be assumed that the job processing it failed, so it can be picked up again.
- in case of a controlled failure, the service must leave the message in the queue to be retried until the max attempts is reached

## Usage

This project uses `Python` over [uv](https://docs.astral.sh/uv/getting-started/installation/). Python does not need to be explicitly installed to use uv. By default, uv will automatically download Python versions when they are required.

Some examples:

```bash
# Installation
uv sync # get deps from .toml
uv run python -V # check installation

# Using tooling
uv run pre-commit run --all-files
uv run ruff format
```

To run the service, copy the `.env.example` as `.env` and fill the environment variables. Then use `main.py` as the entrypoint.

```bash
# Start worker
uv run main.py
```

The server also needs to enable the feature flag to use the new ifc-import-service.
Make sure to set the required feature flags correctly in the server `.env` file:

```bash
FF_NEXT_GEN_FILE_IMPORTER_ENABLED="true"
```
