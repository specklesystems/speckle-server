import SpeckleBasicMaterial from './SpeckleBasicMaterial.js'
import { speckleViewportVert } from './shaders/speckle-viewport-vert.js'
import { speckleViewportFrag } from './shaders/speckle-viewport-frag.js'
import { MeshBasicMaterialParameters } from 'three'
import { Uniforms } from './SpeckleMaterial.js'

class SpeckleViewportMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleViewportVert
  }

  protected get fragmentProgram(): string {
    return speckleViewportFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, falloff: 0 }
  }

  constructor(parameters: MeshBasicMaterialParameters, defines = ['USE_RTE']) {
    super(parameters, defines)
  }

  public set falloff(value: number) {
    this.userData.falloff.value = value
    this.needsUpdate = true
  }
}

export default SpeckleViewportMaterial
