import time
import traceback
from pathlib import Path
from pprint import pprint

from speckleifc.main import open_and_convert_file
from specklepy.logging import metrics

from ifc_importer.client import setup_client
from ifc_importer.domain import (
    FileimportError,
    FileimportPayload,
    FileimportResult,
    FileimportSuccess,
)


def process_job(
    work_dir_path: str,
    job_payload: str,
) -> None:
    work_dir = Path(work_dir_path)
    outcome = None
    try:
        # Forcefully reset metrics,
        # we don't want it to reuse any server/user ids between jobs
        metrics.METRICS_TRACKER = None
        metrics.HOST_APP = "ifc"
        print(job_payload)

        job = FileimportPayload.model_validate_json(job_payload)
        start = time.time()

        client = setup_client(job)

        file_path = client.file_import.download_file(
            job.project_id, job.blob_id, work_dir.joinpath(job.file_name)
        )
        download_end = time.time()
        download_duration = download_end - start
        project = client.project.get(job.project_id)

        version = open_and_convert_file(
            file_path=str(file_path),
            client=client,
            project=project,
            model_id=job.model_id,
            version_message=f"Created from {job.file_name} upload.",
        )
        parse_end = time.time()
        parse_duration = parse_end - download_end
        outcome = FileimportSuccess(
            version_id=version.id,
            download_duration_seconds=download_duration,
            parse_duration_seconds=parse_duration,
        )
    except Exception as ex:
        stack_trace = traceback.format_exc()
        outcome = FileimportError(reason=str(ex), stack_trace=stack_trace)
    finally:
        if outcome:
            pprint(outcome)
            work_dir.joinpath("result.json").write_text(
                FileimportResult(outcome=outcome).model_dump_json()
            )
