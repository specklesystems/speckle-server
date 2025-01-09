import sys, os
import json
from specklepy.objects import Base
from specklepy.objects.other import RenderMaterial
from specklepy.objects.geometry import Mesh
from specklepy.transports.server import ServerTransport
from specklepy.api.client import SpeckleClient
from specklepy.api import operations
from obj_file import ObjFile

import structlog
from logging import INFO, basicConfig

basicConfig(format="%(message)s", stream=sys.stdout, level=INFO)

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.UnicodeDecoder(),
        structlog.processors.CallsiteParameterAdder(
            {
                structlog.processors.CallsiteParameter.FILENAME,
                structlog.processors.CallsiteParameter.FUNC_NAME,
                structlog.processors.CallsiteParameter.LINENO,
            }
        ),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(INFO),
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
LOG = structlog.get_logger()
DEFAULT_BRANCH = "uploads"


def convert_material(obj_mat):
    speckle_mat = RenderMaterial()
    speckle_mat.name = obj_mat["name"]
    if "diffuse" in obj_mat:
        argb = [
            1,
        ] + obj_mat["diffuse"]
        speckle_mat.diffuse = int.from_bytes(
            [int(val * 255) for val in argb], byteorder="big", signed=True
        )
    if "dissolved" in obj_mat:
        speckle_mat.opacity = obj_mat["dissolved"]
    return speckle_mat


def import_obj():
    (
        file_path,
        tmp_results_path,
        _,
        stream_id,
        branch_name,
        commit_message,
        _,
        _,
        _,
    ) = sys.argv[1:]
    LOG.info("ImportOBJ argv[1:]:%s", sys.argv[1:])

    # Parse input
    obj = ObjFile(file_path)
    LOG.info(
        "Parsed obj with %s faces (%s vertices)", len(obj.faces), len(obj.vertices) * 3
    )

    speckle_root = Base()
    speckle_root["@objects"] = []

    for objname in obj.objects:
        objLogger = LOG.bind(object_name=objname)
        objLogger.info("Converting object")

        speckle_obj = Base()
        speckle_obj.name = objname
        speckle_obj["@displayValue"] = []
        speckle_root["@objects"].append(speckle_obj)

        for obj_mesh in obj.objects[objname]:
            speckle_vertices = [
                coord for point in obj_mesh["vertices"] for coord in point
            ]
            speckle_faces = []
            for obj_face in obj_mesh["faces"]:
                if len(obj_face) == 3:
                    speckle_faces.append(0)
                elif len(obj_face) == 4:
                    speckle_faces.append(1)
                else:
                    speckle_faces.append(len(obj_face))
                speckle_faces.extend(obj_face)

            has_vertex_colors = False
            for vc in obj_mesh["vertex_colors"]:
                if vc is not None:
                    has_vertex_colors = True
            colors = []
            if has_vertex_colors:
                for vc in obj_mesh["vertex_colors"]:
                    if vc is None:
                        r, g, b = (1.0, 1.0, 1.0)
                    else:
                        r, g, b = vc
                    argb = (1.0, r, g, b)
                    color = int.from_bytes(
                        [int(val * 255) for val in argb], byteorder="big", signed=True
                    )
                    colors.append(color)

            speckle_mesh = Mesh(
                vertices=speckle_vertices,
                faces=speckle_faces,
                colors=colors,
                textureCoordinates=[],
            )

            obj_material = obj_mesh["material"]
            if obj_material:
                speckle_mesh["renderMaterial"] = convert_material(obj_material)

            speckle_obj["@displayValue"].append(speckle_mesh)

    # Commit

    client = SpeckleClient(
        host=os.getenv("SPECKLE_SERVER_URL", "127.0.0.1:3000"), use_ssl=False
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
        base=speckle_root, transports=[transport], use_default_cache=False
    )

    commit_id = client.commit.create(
        stream_id=stream_id,
        object_id=id,
        branch_name=(branch_name or DEFAULT_BRANCH),
        message=(commit_message or "OBJ file upload"),
        source_application="OBJ",
    )

    return commit_id, tmp_results_path


if __name__ == "__main__":
    from pathlib import Path

    try:
        commit_id, tmp_results_path = import_obj()
        if not commit_id:
            raise Exception("Can't create commit")
        if isinstance(commit_id, Exception):
            raise commit_id
        results = {"success": True, "commitId": commit_id}
    except Exception as ex:
        LOG.exception(ex)
        results = {"success": False, "error": str(ex)}

    Path(tmp_results_path).write_text(json.dumps(results))
