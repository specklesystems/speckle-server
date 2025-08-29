import asyncio
import tempfile
import time
from math import floor
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
from ifc_importer.repository import (
    deduct_from_compute_budget,
    get_next_job,
    return_job_to_queued,
    setup_connection,
)

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
    logger = logger.bind(parser=parser)
    connection = await setup_connection()
    logger.info("job processor started")
    while True:
        job = await get_next_job(connection)
        if not job:
            logger.debug("no job found")
            await asyncio.sleep(IDLE_TIMEOUT)
            continue

        start = time.time()
        duration = 0
        job_timeout = job.payload.time_out_seconds
        if job.payload.remaining_compute_budget_seconds > 0:
            # respect the remaining compute budget
            job_timeout = min(job_timeout, job.payload.remaining_compute_budget_seconds)

        speckle_client = setup_client(job.payload)

        job_id = job.id
        job_status = JobStatus.QUEUED
        ex: Exception | None = None
        attempt = job.attempt
        version_id: str | None = None

        try:
            if attempt > job.max_attempt:
                # something went wrong, it should have been marked as failed
                raise Exception(
                    "Unhandled error silently failed the job multiple times"
                )

            logger = logger.bind(job_id=job_id, project_id=job.payload.project_id)
            logger.info("starting job")
            handler = job_handler(speckle_client, job.payload, logger)
            # this will raise a TimeoutError if handler does not complete in time
            version, download_duration, parse_duration = await asyncio.wait_for(
                handler, timeout=job_timeout
            )
            version_id = version.id

            duration = time.time() - start
            logger.info(
                "Finished parsing job after {duration}s, creating version {version_id}",
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
            # the server is responsible for moving successful jobs to the succeeded state
            # mark it as succeeded so we do not enter any error handling routines on finalisation
            job_status = JobStatus.SUCCEEDED

        except TimeoutError as te:
            ex = te
            # if it times out we won't automatically try again
            job_status = JobStatus.FAILED

            if job_timeout != job.payload.time_out_seconds:
                # it timed out because it exceeded its remaining compute budget
                ex = TimeoutError("Job exceeded remaining compute budget")

        # raised if the task is canceled
        except Exception as e:
            #
            ex = e
            job_status = JobStatus.FAILED
        finally:
            if duration == 0:
                # it probably failed before we calculated the duration, so calculate it now
                duration = time.time() - start
            await deduct_from_compute_budget(connection, job_id, floor(duration))

            if job_status == JobStatus.QUEUED:
                await return_job_to_queued(connection, job_id)
            elif job_status == JobStatus.FAILED:
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
                    # the server is responsible for moving failed jobs to the failed state, so the worker does not have to do anything further
                except Exception as ex:
                    logger.error("failed to report job failure", exc_info=ex)
                    await return_job_to_queued(connection, job_id)
                    # The client will not pick up a queued job if it now has exceeded max attempts.
                    # The server is responsible for moving queued jobs which have exceeded maximum attempts to failed status.
            elif job_status == JobStatus.SUCCEEDED:
                # do nothing
                # we expect the job to already be marked as succeeded in the database by the server (when the worker reported the results back to the server)
                continue
