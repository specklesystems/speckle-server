from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class JobBase(BaseModel):
    model_config = ConfigDict(  # pyright: ignore[reportUnannotatedClassAttribute]
        alias_generator=to_camel, populate_by_name=True
    )


class FileimportPayload(JobBase):
    """Payload for the fileimport job"""

    payload_version: Literal[1]
    job_type: Literal["fileImport"]
    server_url: str
    project_id: str
    model_id: str
    token: str
    blob_id: str
    file_type: str
    file_name: str
    time_out_seconds: int


class FileimportSuccess(JobBase):
    download_duration_seconds: float
    parse_duration_seconds: float
    version_id: str


class FileimportError(JobBase):
    reason: str


class FileimportResult(JobBase):
    outcome: FileimportSuccess | FileimportError


class JobStatus(StrEnum):
    """Status enumeration for the job."""

    QUEUED = "queued"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class FileimportJob(JobBase):
    """DB model for the fileimport job."""

    id: str
    job_type: Literal["fileImport"]
    payload: FileimportPayload
    status: JobStatus
    attempt: int
    max_attempt: int
    created_at: datetime
    updated_at: datetime
    remaining_compute_budget_seconds: int
