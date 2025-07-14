import asyncio

from specklepy.core.api.client import (  # pyright: ignore[reportMissingTypeStubs]
    SpeckleClient,
)

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


async def job_processor():
    while True:
        connection = await setup_connection()
        async with connection.transaction():
            job = await get_next_job(connection)
            if not job:
                print("no job found")
                await asyncio.sleep(IDLE_TIMEOUT)
                continue

            # speckle_client = setup_client(job.payload)

            job_id = job.id
            job_status = JobStatus.QUEUED
            attempt = job.attempt + 1

            try:
                print("starting job")
                job_handler = asyncio.sleep(10)
                # this will raise a TimeoutError if handler does not complete in time
                await asyncio.wait_for(
                    job_handler, timeout=job.payload.time_out_seconds
                )

                print("finished job")

                job_status = JobStatus.SUCCEEDED

            except TimeoutError:
                # if it times out we allow re-queueing until it reaches max tries
                if job.attempt >= job.max_attempt:
                    job_status = JobStatus.FAILED
                else:
                    job_status = JobStatus.QUEUED

            # raised if the task is canceled
            except Exception:
                #
                job_status = JobStatus.FAILED
            finally:
                if job_status == JobStatus.FAILED:
                    # we should be reporting the failure to the server
                    print("fully failed")
                await set_job_status(connection, job_id, job_status, attempt)
