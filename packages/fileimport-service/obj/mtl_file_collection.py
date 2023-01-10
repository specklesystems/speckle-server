import os

import structlog

LOG = structlog.get_logger()


class MtlFileCollection(object):
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.logged_unsupported = set()
        self.materials = {}
        self.crt_mat = None

    def ensure_mat(self, directive):
        if (
            self.crt_mat is None
            and f"no_mat_{directive}" not in self.logged_unsupported
        ):
            LOG.info("Directive found outside material definition:%s", directive)
            self.logged_unsupported.add(f"no_mat_{directive}")
        return self.crt_mat is not None

    def mtllib(self, fpath):
        fpath = os.path.join(self.base_dir, os.path.basename(fpath))
        if not os.path.isfile(fpath):
            LOG.error("Missing MTL file:%s", fpath)
            return

        with open(fpath, "r") as f:
            while True:
                line = f.readline()
                if not line:
                    break
                if not line.strip() or line.startswith("#"):
                    continue
                parts = line.strip().split(" ")
                if parts[0] == "newmtl":
                    mat_name = " ".join(parts[1:])
                    self.crt_mat = {"name": mat_name}
                    self.materials[mat_name] = self.crt_mat
                elif parts[0] == "Ka":
                    if self.ensure_mat("Ka"):
                        self.crt_mat["ambient"] = [float(x) for x in parts[1:]]
                elif parts[0] == "Kd":
                    if self.ensure_mat("Kd"):
                        self.crt_mat["diffuse"] = [float(x) for x in parts[1:]]
                elif parts[0] == "Ks":
                    if self.ensure_mat("Ks"):
                        self.crt_mat["specular_color"] = [float(x) for x in parts[1:]]
                elif parts[0] == "Ns":
                    if self.ensure_mat("Ns"):
                        self.crt_mat["specular_exponent"] = float(parts[1])
                elif parts[0] == "d":
                    if self.ensure_mat("d"):
                        self.crt_mat["dissolved"] = float(parts[1])
                elif parts[0] == "Tr":
                    if self.ensure_mat("Tr"):
                        self.crt_mat["dissolved"] = 1.0 - float(parts[1])
                elif parts[0] == "Ni":
                    if self.ensure_mat("Ni"):
                        self.crt_mat["refraction_index"] = float(parts[1])
                elif parts[0] == "illum":
                    if self.ensure_mat("illum"):
                        self.crt_mat["illumination_mode"] = int(parts[1])
                elif parts[0] == "Pr":
                    if self.ensure_mat("Pr"):
                        self.crt_mat["roughness"] = float(parts[1])
                elif parts[0] == "Pm":
                    if self.ensure_mat("Pm"):
                        self.crt_mat["metallic"] = float(parts[1])
                elif parts[0] == "Ke":
                    if self.ensure_mat("Ke"):
                        self.crt_mat["emissive"] = [float(x) for x in parts[1:]]
                else:
                    if parts[0] not in self.logged_unsupported:
                        LOG.warn("Unsupported MTL directive: %s", parts[0])
                        self.logged_unsupported.add(parts[0])
        self.crt_mat = None

    def get_material(self, name):
        return self.materials.get(name, None)
