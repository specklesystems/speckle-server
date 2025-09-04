import json

from asyncpg import Connection, connect

from ifc_importer.config import settings
from ifc_importer.domain import FileimportJob, JobStatus


async def setup_connection() -> Connection:
    connection = await connect(settings.fileimport_queue_postgres_url)
    await connection.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )
    return connection


async def get_next_job(connection: Connection) -> FileimportJob | None:
    """Get a fileimport job from the connection."""

    job = await connection.fetchrow(
        """
        WITH next_job AS (
            UPDATE background_jobs
            SET
                "attempt" = "attempt" + 1,
                "status" = $1,
                "updatedAt" = NOW()
            WHERE id = (
                SELECT id FROM background_jobs
                WHERE ( -- job in a QUEUED state which has not yet exceeded maximum attempts and has a positive remaining compute budget
                    payload ->> 'fileType' = 'ifc'
                    AND status = $2
                    AND "attempt" < "maxAttempt"
                    AND "remainingComputeBudgetSeconds"::int > 0
                )
                OR ( -- any job left in a PROCESSING state for more than its timeout period
                    payload ->> 'fileType' = 'ifc'
                    AND status = $1
                    AND "updatedAt" < NOW() - (payload ->> "timeOutSeconds")::int * interval '1 second'
                )
                ORDER BY "createdAt"
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            )
            RETURNING *
        )
        SELECT * FROM next_job;
        """,
        JobStatus.PROCESSING.value,
        JobStatus.QUEUED.value,
    )
    if not job:
        return None
    return FileimportJob.model_validate(dict(job))


async def return_job_to_queued(connection: Connection, job_id: str) -> None:
    print(f"returning job: {job_id} to queued")
    return await set_job_status(connection, job_id, JobStatus.QUEUED)


async def set_job_status(
    connection: Connection, job_id: str, job_status: JobStatus
) -> None:
    print(f"updating job: {job_id}'s status to {job_status}")
    _ = await connection.execute(
        """
        UPDATE background_jobs
        SET status = $1,
            "updatedAt" = NOW()
        WHERE id = $2
        """,
        job_status.value,
        job_id,
    )


async def deduct_from_compute_budget(
    connection: Connection, job_id: str, used_compute_time_seconds: int
) -> None:
    print(
        f"updating job: {job_id}'s remaining compute budget by deducting {used_compute_time_seconds} seconds"
    )
    _ = await connection.execute(
        """
        UPDATE background_jobs
        SET "remainingComputeBudgetSeconds" = "remainingComputeBudgetSeconds"::int - $1,
            "updatedAt" = NOW()
        WHERE id = $2
        """,
        used_compute_time_seconds,
        job_id,
    )
