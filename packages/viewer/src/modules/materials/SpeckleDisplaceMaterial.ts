import { speckleDisplaceVert } from './shaders/speckle-displace.vert'
import { speckleDisplaceFrag } from './shaders/speckle-displace-frag'
import { Material, Vector2, type MeshBasicMaterialParameters } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { type Uniforms } from './SpeckleMaterial'

class SpeckleDisplaceMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleDisplaceVert
  }

  protected get fragmentProgram(): string {
    return speckleDisplaceFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, size: new Vector2(), displacement: 0 }
  }

  constructor(parameters: MeshBasicMaterialParameters, defines: string[] = []) {
    super(parameters, defines)
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    to.userData.displacement.value = from.userData.displacement.value
  }
}

export default SpeckleDisplaceMaterial
