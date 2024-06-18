import { speckleGhostVert } from './shaders/speckle-ghost-vert'
import { speckleGhostFrag } from './shaders/speckle-ghost-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import type { MeshBasicMaterialParameters } from 'three'

class SpeckleGhostMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleGhostVert
  }

  protected get fragmentProgram(): string {
    return speckleGhostFrag
  }

  constructor(
    parameters: MeshBasicMaterialParameters,
    defines: string[] = ['USE_RTE']
  ) {
    super(parameters, defines)
  }
}

export default SpeckleGhostMaterial
