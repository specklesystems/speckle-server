/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleGhostVert } from './shaders/speckle-ghost-vert'
import { speckleGhostFrag } from './shaders/speckle-ghost-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'

class SpeckleGhostMaterial extends SpeckleBasicMaterial {
  protected get vertexShader(): string {
    return speckleGhostVert
  }

  protected get fragmentShader(): string {
    return speckleGhostFrag
  }

  constructor(parameters, defines = []) {
    super(parameters, defines)
  }
}

export default SpeckleGhostMaterial
