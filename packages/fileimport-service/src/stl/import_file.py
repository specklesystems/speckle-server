import json
from typing import Optional
import stl
from specklepy.objects.geometry import Mesh
from specklepy.transports.server import ServerTransport
from specklepy.api.client import SpeckleClient
from specklepy.api import operations
from specklepy.core.api.inputs import CreateModelInput, CreateVersionInput
from specklepy.objects.models.units import Units
from specklepy.core.api.models import Version

import sys
import os

DEFAULT_BRANCH = "uploads"


def import_stl(
    file_path: str,
    project_id: str,
    model_id: Optional[str],
    branch_name: str,
    commit_message: str,
) -> Version:
    print(f"ImportSTL argv[1:]: {sys.argv[1:]}")

    # Parse input
    stl_mesh = stl.mesh.Mesh.from_file(file_path)
    print(
        f"Parsed mesh with {stl_mesh.points.shape[0]} faces ({stl_mesh.points.shape[0] * 3} vertices)"
    )

    # Construct speckle obj
    vertices = stl_mesh.points.flatten().tolist()
    faces = []
    for i in range(stl_mesh.points.shape[0]):
        faces.extend([3, 3 * i, 3 * i + 1, 3 * i + 2])

    speckle_mesh = Mesh(
        vertices=vertices,
        faces=faces,
        units=Units.none,
    )
    print("Constructed Speckle Mesh object")

    # Commit

    client = SpeckleClient(
        host=os.getenv("SPECKLE_SERVER_URL", "127.0.0.1:3000"), use_ssl=False
    )
    token = os.environ["USER_TOKEN"]
    if not token:
        raise Exception('Expected an env var "USER_TOKEN"')
    client.authenticate_with_token(token)

    if model_id:
        model = client.model.get(model_id, project_id)
    else:
        model = client.model.create(
            CreateModelInput(
                name=branch_name,
                description="File upload branch" if branch_name == "uploads" else "",
                project_id=project_id,
            ),
        )

    transport = ServerTransport(client=client, stream_id=project_id)
    id = operations.send(
        base=speckle_mesh,
        transports=[transport],
        use_default_cache=False,
    )

    create_version = CreateVersionInput(
        project_id=project_id,
        object_id=id,
        model_id=model.id,
        message=(commit_message or "STL file upload"),
        source_application="STL",
    )
    version = client.version.create(create_version)

    return version


if __name__ == "__main__":
    from pathlib import Path

    (
        file_path,
        tmp_results_path,
        _,
        project_id,
        branch_name,
        commit_message,
        _,
        model_id,
        _,
    ) = sys.argv[1:]
    try:
        version = import_stl(
            file_path, project_id, model_id, branch_name, commit_message
        )
        results = {"success": True, "commitId": version.id}
    except Exception as ex:
        results = {"success": False, "error": str(ex)}
        print(ex)

    print(results)
    Path(tmp_results_path).write_text(json.dumps(results))
