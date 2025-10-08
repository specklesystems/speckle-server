import sys
import os
import json
from typing import Any, Dict, List, Optional
from specklepy.objects.models.collections.collection import Collection
from specklepy.objects.base import Base
from specklepy.objects.other import RenderMaterial
from specklepy.objects.geometry import Mesh
from specklepy.transports.server import ServerTransport
from specklepy.api.client import SpeckleClient
from specklepy.objects.models.units import Units
from specklepy.objects.data_objects import DataObject
from specklepy.api import operations
from specklepy.core.api.inputs import CreateModelInput, CreateVersionInput
from specklepy.core.api.models import Version
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


def convert_material(obj_mat: Dict[str, Any]) -> RenderMaterial:
    if "diffuse" in obj_mat:
        argb = [
            1,
        ] + obj_mat["diffuse"]
        diffuse = int.from_bytes(
            [int(val * 255) for val in argb], byteorder="big", signed=True
        )
    else:
        diffuse = 0

    opacity = obj_mat["dissolved"] if "dissolved" in obj_mat else 1
    metallic = obj_mat["metallic"] if "metallic" in obj_mat else 0
    roughness = obj_mat["roughness"] if "roughness" in obj_mat else 0

    return RenderMaterial(
        name=obj_mat["name"],
        diffuse=diffuse,
        opacity=opacity,
        roughness=roughness,
        metalness=metallic,
    )


def convert_objects(objects: Dict[str, List[Dict[str, Any]]]) -> Collection:
    converted_objects: List[Base] = []

    for objname in objects:
        objLogger = LOG.bind(object_name=objname)
        objLogger.info("Converting object")

        display_values: List[Base] = []

        for obj_mesh in objects[objname]:
            speckle_vertices = [
                coord for point in obj_mesh["vertices"] for coord in point
            ]
            speckle_faces = []
            for obj_face in obj_mesh["faces"]:
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
                units=Units.none,
            )

            obj_material = obj_mesh["material"]
            if obj_material:
                speckle_mesh["renderMaterial"] = convert_material(obj_material)

            display_values.append(speckle_mesh)

        speckle_obj = DataObject(
            name=objname, displayValue=display_values, properties={}
        )
        converted_objects.append(speckle_obj)

    return Collection(name=os.path.basename(file_path), elements=converted_objects)


def import_obj(
    file_path: str,
    project_id: str,
    model_id: Optional[str],
    branch_name: str,
    commit_message: str,
) -> Version:
    # Parse input
    obj = ObjFile(file_path)
    LOG.info(
        "Parsed obj with %s faces (%s vertices)", len(obj.faces), len(obj.vertices) * 3
    )

    speckle_root = convert_objects(obj.objects)

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
        model_create_input = CreateModelInput(
            name=branch_name,
            description="File upload branch" if branch_name == "uploads" else "",
            project_id=project_id,
        )
        model = client.model.create(model_create_input)

    transport = ServerTransport(client=client, stream_id=project_id)
    id = operations.send(
        base=speckle_root, transports=[transport], use_default_cache=False
    )

    create_commit = CreateVersionInput(
        object_id=id,
        model_id=model.id,
        project_id=project_id,
        message=(commit_message or "OBJ file upload"),
        source_application="OBJ",
    )
    version = client.version.create(create_commit)

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
        LOG.info("ImportOBJ argv[1:]:%s", sys.argv[1:])
        version = import_obj(
            file_path, project_id, model_id, branch_name, commit_message
        )
        results = {"success": True, "commitId": version.id}
    except Exception as ex:
        LOG.exception(ex)
        results = {"success": False, "error": str(ex)}

    Path(tmp_results_path).write_text(json.dumps(results))
