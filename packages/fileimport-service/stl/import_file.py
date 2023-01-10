import json
import stl
from specklepy.objects.geometry import Mesh
from specklepy.transports.server import ServerTransport
from specklepy.api.client import SpeckleClient
from specklepy.api import operations

import sys, os

TMP_RESULTS_PATH = "/tmp/import_result.json"
DEFAULT_BRANCH = "uploads"


def import_stl():
    file_path, _, stream_id, branch_name, commit_message = sys.argv[1:]
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
        faces.extend([0, 3 * i, 3 * i + 1, 3 * i + 2])

    speckle_mesh = Mesh(
        vertices=vertices, faces=faces, colors=[], textureCoordinates=[]
    )
    print("Constructed Speckle Mesh object")

    # Commit

    client = SpeckleClient(
        host=os.getenv("SPECKLE_SERVER_URL", "localhost:3000"), use_ssl=False
    )
    client.authenticate_with_token(os.environ["USER_TOKEN"])

    if not client.branch.get(stream_id, branch_name):
        client.branch.create(
            stream_id,
            branch_name,
            "File upload branch" if branch_name == "uploads" else "",
        )

    transport = ServerTransport(client=client, stream_id=stream_id)
    id = operations.send(
        base=speckle_mesh,
        transports=[transport],
        use_default_cache=False,
    )

    commit_id = client.commit.create(
        stream_id=stream_id,
        object_id=id,
        branch_name=(branch_name or DEFAULT_BRANCH),
        message=(commit_message or "STL file upload"),
        source_application="STL",
    )

    return commit_id


if __name__ == "__main__":
    from pathlib import Path

    try:
        commit_id = import_stl()
        results = {"success": True, "commitId": commit_id}
    except Exception as ex:
        results = {"success": False, "error": str(ex)}
        print(ex)

    print(results)
    Path(TMP_RESULTS_PATH).write_text(json.dumps(results))
