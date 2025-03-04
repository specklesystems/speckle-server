from mtl_file_collection import MtlFileCollection
import os

import structlog

LOG = structlog.get_logger()


class ObjFile(object):
    def __init__(self, file_path) -> None:
        self.logged_unsupported = set()
        self.mtl_files = MtlFileCollection(os.path.dirname(file_path))

        self.crt_object = ""
        self.crt_mtl = ""

        self.vertices = []
        self.vertex_colors = []
        self.faces = []

        # Constructed in the post-process phase
        self.objects = {}

        with open(file_path, "r") as f:
            while True:
                line = f.readline()
                if not line:
                    break
                if not line.strip() or line.startswith("#"):
                    continue
                parts = line.strip().split(" ")
                if parts[0] == "v":
                    self.on_v(parts[1:])
                elif parts[0] == "l":
                    self.on_l(parts[1:])
                elif parts[0] == "f":
                    self.on_f(parts[1:])
                elif parts[0] == "mtllib":
                    self.mtl_files.mtllib(" ".join(parts[1:]))
                elif parts[0] == "usemtl":
                    self.crt_mtl = " ".join(parts[1:])
                elif parts[0] == "o":
                    self.crt_object = parts[1]
                else:
                    if parts[0] not in self.logged_unsupported:
                        LOG.warn("Unsupported OBJ directive: " + parts[0])
                        self.logged_unsupported.add(parts[0])
        self.post_process()

    def flatten_vertices(self):
        return [coord for point in self.vertices for coord in point]

    def on_v(self, params):
        r, g, b = None, None, None
        w = 1.0
        if len(params) == 3:
            x, y, z = [float(param) for param in params]
        if len(params) == 4:
            x, y, z, w = [float(param) for param in params]
        if len(params) == 6:
            x, y, z, r, g, b = [float(param) for param in params]
        self.vertices.append((x, z, y))
        if r is None or g is None or b is None:
            self.vertex_colors.append(None)
        else:
            self.vertex_colors.append((r, g, b))

    def on_l(self, params):
        # TODO: handle lines
        pass

    def on_f(self, params):
        indices = []
        for param in params:
            # TODO: use texture coordinate index / use vertex normal index?
            v_index = int(param.split("/")[0])
            # If an index is positive then it refers to the offset in that vertex list, starting at 1.
            # If an index is negative then it relatively refers to the end of the vertex list, -1 referring to the last element.
            if v_index > 0:
                v_index -= 1
            indices.append(v_index)

        self.faces.append(
            {"indices": indices, "object": self.crt_object, "mtl": self.crt_mtl}
        )

    def post_process(self):
        # Step 1: group into object_id/material_id/[faces_with_global_indices]
        objects = {}
        for face in self.faces:
            if face["object"] not in objects:
                objects[face["object"]] = {}
            obj = objects[face["object"]]
            if face["mtl"] not in obj:
                obj[face["mtl"]] = []
            obj[face["mtl"]].append(face["indices"])

        # Step 2: construct final structure: object_id / [{material, local_vertices, vertex_colors, faces_with_local_indices}]
        for object in objects:
            self.objects[object] = []
            for mtl in objects[object].keys():
                material = self.mtl_files.get_material(mtl)
                vertices = []
                vertex_colors = []
                faces = []

                v_global2local_id = {}
                for face in objects[object][mtl]:
                    for global_v in face:
                        if global_v not in v_global2local_id:
                            v_global2local_id[global_v] = len(vertices)
                            vertices.append(self.vertices[global_v])
                            vertex_colors.append(self.vertex_colors[global_v])

                    faces.append([v_global2local_id[global_id] for global_id in face])

                self.objects[object].append(
                    {
                        "material": material,
                        "vertices": vertices,
                        "vertex_colors": vertex_colors,
                        "faces": faces,
                    }
                )
