from specklepy.core.api.client import (  # pyright: ignore[reportMissingTypeStubs]
    SpeckleClient,
)

from src.ifc_importer.domain import FileimportPayload


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

    if not speckle_client.account.userInfo.email:
        raise ValueError(
            "activeUser.email did not get fetched. Does the token lack profile:email?"
        )

    return speckle_client
