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
        SELECT * FROM background_jobs
        WHERE payload ->> 'fileType' = 'ifc' AND status = $1 AND attempt < "maxAttempt"
        ORDER BY "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        """,
        JobStatus.QUEUED.value,
    )
    if not job:
        return None
    return FileimportJob.model_validate(dict(job))


async def set_job_status(
    connection: Connection, job_id: str, job_status: JobStatus, attempt: int
) -> None:
    print(f"updating job: {job_id}'s status to {job_status}, with attempt: {attempt}")
    _ = await connection.execute(
        """
        UPDATE background_jobs
        SET status = $1, "updatedAt" = NOW(), attempt = $3
        WHERE id = $2
        """,
        job_status.value,
        job_id,
        attempt,
    )
