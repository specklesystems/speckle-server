import SpeckleBasicMaterial from './SpeckleBasicMaterial.js'
import { speckleViewportVert } from './shaders/speckle-viewport-vert.js'
import { speckleViewportFrag } from './shaders/speckle-viewport-frag.js'
import { MeshBasicMaterialParameters } from 'three'

class SpeckleViewportMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleViewportVert
  }

  protected get fragmentProgram(): string {
    return speckleViewportFrag
  }

  constructor(parameters: MeshBasicMaterialParameters, defines = ['USE_RTE']) {
    super(parameters, defines)
  }
}

export default SpeckleViewportMaterial
