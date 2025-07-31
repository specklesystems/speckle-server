import asyncio
import tempfile
import time
from pathlib import Path

import structlog
from speckleifc.main import open_and_convert_file
from specklepy.core.api.client import (  # pyright: ignore[reportMissingTypeStubs]
    SpeckleClient,
)
from specklepy.core.api.inputs.file_import_inputs import (
    FileImportErrorInput,
    FileImportResult,
    FileImportSuccessInput,
)
from specklepy.core.api.models import Version

from ifc_importer.domain import FileimportPayload, JobStatus
from ifc_importer.repository import get_next_job, set_job_status, setup_connection

IDLE_TIMEOUT = 1


def setup_client(job_payload: FileimportPayload) -> SpeckleClient:
    speckle_client = SpeckleClient(
        job_payload.server_url,
        job_payload.server_url.startswith("https"),
    )
    speckle_client.authenticate_with_token(job_payload.token)
    if not speckle_client.account:
        msg = (
            f"Could not authenticate to {job_payload.server_url}",
            "with the provided token",
        )
        raise ValueError(msg)
    return speckle_client


async def job_handler(
    client: SpeckleClient, job: FileimportPayload, logger: structlog.stdlib.BoundLogger
) -> tuple[Version, float, float]:
    # this will create a new temp file and also close it, when the with block closes
    with tempfile.NamedTemporaryFile() as file:
        start = time.time()
        file_path = client.file_import.download_file(
            job.project_id, job.blob_id, Path(file.name)
        )
        download_end = time.time()
        download_duration = download_end - start
        logger.info(
            "Finished source file download after {download_duration}",
            download_duration=download_duration,
        )
        version = open_and_convert_file(
            file_path=str(file_path),
            client=client,
            project_id=job.project_id,
            model_id=job.model_id,
            version_message=f"Created from {job.file_name} upload.",
        )
        parse_end = time.time()
        parse_duration = parse_end - download_end
        logger.info(
            "Finished parsing after {parse_duration}",
            parse_duration=parse_duration,
        )
        return version, download_duration, parse_duration


async def job_processor(logger: structlog.stdlib.BoundLogger):
    parser = "speckle_ifc"
    connection = await setup_connection()
    while True:
        job = await get_next_job(connection)
        if not job:
            logger.info("no job found")
            await asyncio.sleep(IDLE_TIMEOUT)
            continue

        start = time.time()
        speckle_client = setup_client(job.payload)

        job_id = job.id
        job_status = JobStatus.QUEUED
        ex: Exception | None = None
        attempt = job.attempt
        version_id: str | None = None

        try:
            if ( attempt > job.max_attempt ):
                # something went wrong, it should have been marked as failed
                raise Exception('Unhandled error silently failed the job multiple times')

            logger = logger.bind(job_id=job_id, project_id=job.payload.project_id)
            logger.info("starting job")
            handler = job_handler(speckle_client, job.payload, logger)
            # this will raise a TimeoutError if handler does not complete in time
            version, download_duration, parse_duration = await asyncio.wait_for(
                handler, timeout=job.payload.time_out_seconds
            )
            version_id = version.id

            duration = time.time() - start
            logger.info(
                "Finished job after {duration} created version {version_id}",
                duration=duration,
                version_id=version_id,
            )

            _ = speckle_client.file_import.finish_file_import_job(
                FileImportSuccessInput(
                    project_id=job.payload.project_id,
                    # for some reason, the blob id identifies the job here
                    job_id=job.payload.blob_id,
                    result=FileImportResult(
                        parser=parser,
                        version_id=version_id,
                        download_duration_seconds=download_duration,
                        duration_seconds=duration,
                        parse_duration_seconds=parse_duration,
                    ),
                )
            )

            job_status = JobStatus.SUCCEEDED

        except TimeoutError as te:
            # if it times out we allow re-queueing until it reaches max tries
            ex = te
            if attempt >= job.max_attempt:
                job_status = JobStatus.FAILED
            else:
                job_status = JobStatus.QUEUED

        # raised if the task is canceled
        except Exception as e:
            #
            ex = e
            job_status = JobStatus.FAILED
        finally:
            if job_status == JobStatus.FAILED:
                # we should be reporting the failure to the server
                logger.error("job processing failed", exc_info=ex)
                try:
                    _ = speckle_client.file_import.finish_file_import_job(
                        FileImportErrorInput(
                            project_id=job.payload.project_id,
                            # for some reason, the blob id identifies the job here
                            job_id=job.payload.blob_id,
                            # job_id=job_id,
                            reason=str(ex),
                            result=FileImportResult(
                                parser=parser,
                                version_id=None,
                                download_duration_seconds=0,
                                duration_seconds=time.time() - start,
                                parse_duration_seconds=0,
                            ),
                        )
                    )
                # if the reporting of the failure does not succeed, we're requeueing
                # unless we've reached the max attempts
                except Exception as ex:
                    if attempt >= job.max_attempt:
                        job_status = JobStatus.FAILED
                    else:
                        job_status = JobStatus.QUEUED
            await set_job_status(connection, job_id, job_status)
