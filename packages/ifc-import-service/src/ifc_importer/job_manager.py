import asyncio
import base64
import tempfile
import time
from math import floor
from pathlib import Path

import structlog
from specklepy.core.api.inputs.file_import_inputs import (
    FileImportErrorInput,
    FileImportResult,
    FileImportSuccessInput,
)
from specklepy.logging import metrics

from ifc_importer.client import setup_client
from ifc_importer.domain import FileimportError, FileimportResult, JobStatus
from ifc_importer.repository import (
    deduct_from_compute_budget,
    get_next_job,
    return_job_to_queued,
    setup_connection,
)

IDLE_TIMEOUT = 1


async def job_manager(logger: structlog.stdlib.BoundLogger):
    parser = "speckle_ifc"
    logger = logger.bind(parser=parser)
    connection = await setup_connection()
    logger.info("job processor started")
    while True:
        job = await get_next_job(connection)
        if not job:
            await asyncio.sleep(IDLE_TIMEOUT)
            continue

        start = time.time()
        duration = 0
        job_timeout = max(
            1, min(job.payload.time_out_seconds, job.remaining_compute_budget_seconds)
        )

        # Forcefully reset metrics,
        # we don't want it to reuse any server/user ids between jobs
        metrics.METRICS_TRACKER = None
        metrics.HOST_APP = "ifc"

        speckle_client = setup_client(job.payload)

        job_id = job.id
        job_status = JobStatus.QUEUED
        ex: Exception | None = None
        attempt = job.attempt
        version_id: str | None = None

        # this will create a new temp directory and also delete it,
        #  when the with block closes
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # i do not get this why are we handling this here?
                if attempt > job.max_attempt:
                    # something went wrong, it should have been marked as failed
                    raise Exception(
                        "Unhandled error silently failed the job multiple times"
                    )

                logger = logger.bind(job_id=job_id, project_id=job.payload.project_id)
                logger.info(
                    "starting job {job_id} for project {project_id},"
                    + " attempt {attempt} /"
                    + " {max_attempts} with remaining compute budget"
                    + " {remaining_compute_budget_seconds}s and timeout {job_timeout}s",
                    attempt=attempt,
                    max_attempts=job.max_attempt,
                    remaining_compute_budget_seconds=job.remaining_compute_budget_seconds,
                    job_timeout=job_timeout,
                )
                cmd = (
                    f"python job_processor.py {temp_dir}"
                    + f" {
                        base64.b64encode(
                            job.payload.model_dump_json().encode()
                        ).decode()
                    }"
                )
                # subprocess
                process = await asyncio.create_subprocess_shell(
                    cmd,
                )
                exit_code = await asyncio.wait_for(process.wait(), timeout=job_timeout)
                # this should never happen, as the job processor is handling errors
                # when the process is killed with a timeout we raise a TimeoutError
                if exit_code != 0:
                    raise Exception(f"Job failed with exit code {exit_code}")

                result_path = Path(temp_dir, "result.json")
                if not result_path.exists():
                    # is this a special case?
                    raise Exception("Job exited without a result")
                # temp_dir.join("result.json")

                outcome = FileimportResult.model_validate_json(
                    result_path.read_text()
                ).outcome

                if isinstance(outcome, FileimportError):
                    logger.error(
                        "File import subprocess failed", exc_info=outcome.stack_trace
                    )
                    raise Exception(outcome.reason)

                # except TimeoutError as te:
                #     print(te)

                # handler = job_handler(speckle_client, job.payload, logger)
                # this will raise a TimeoutError if handler does not complete in time
                # version, download_duration, parse_duration = await asyncio.wait_for(
                #     handler, timeout=job_timeout
                # )
                version_id = outcome.version_id

                duration = time.time() - start
                logger.info(
                    "Finished parsing job after {duration}s,"
                    + " creating version {version_id}",
                    duration=duration,
                    version_id=version_id,
                )

                _ = speckle_client.file_import.finish_file_import_job(
                    FileImportSuccessInput(
                        project_id=job.payload.project_id,
                        # the blob id identifies the "job" here
                        job_id=job.payload.blob_id,
                        result=FileImportResult(
                            parser=parser,
                            version_id=version_id,
                            download_duration_seconds=outcome.download_duration_seconds,
                            duration_seconds=duration,
                            parse_duration_seconds=outcome.parse_duration_seconds,
                        ),
                    )
                )
                # the server is responsible for moving successful
                # jobs to the succeeded state
                # mark it as succeeded so we do not enter any error
                # handling routines on finalisation
                job_status = JobStatus.SUCCEEDED

            # raised if the task is canceled
            except Exception as e:
                #
                ex = e
                job_status = JobStatus.FAILED
            finally:
                if duration <= 0:
                    # it probably failed before we calculated the duration,
                    # so calculate it now
                    duration = time.time() - start
                    await deduct_from_compute_budget(
                        connection, logger, job_id, floor(duration)
                    )

                if job_status == JobStatus.FAILED:
                    # we should be reporting the failure to the server
                    logger.error("job processing failed", exc_info=ex)
                    try:
                        _ = speckle_client.file_import.finish_file_import_job(
                            FileImportErrorInput(
                                project_id=job.payload.project_id,
                                # the blob id identifies the job to the server
                                job_id=job.payload.blob_id,
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
                        # the server is responsible for moving failed jobs to the
                        # failed state
                        # so the worker does not have to do anything further
                    except Exception as ex:
                        logger.error("failed to report job failure", exc_info=ex)
                        # somehow we're in a weird state,
                        # let's return the job to the queued state
                        # where it will get picked up again until one of total timeout,
                        # max attempts, or exhausted compute budget is reached
                        # The server is responsible for garbage collecting jobs
                        # which have reached these error conditions and moving
                        # them to a failed status.
                        await return_job_to_queued(connection, logger, job_id)
                elif job_status == JobStatus.SUCCEEDED:
                    # do nothing
                    # we expect the job to already be marked as succeeded in the
                    # database by the server (when the worker reported
                    # the results back to the server)
                    continue
