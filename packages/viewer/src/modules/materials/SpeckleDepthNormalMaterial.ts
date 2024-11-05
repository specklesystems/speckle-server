import { speckleDepthNormalVert } from './shaders/speckle-depth-normal-vert.js'
import { speckleDepthNormalFrag } from './shaders/speckle-depth-normal-frag.js'
import SpeckleDepthMaterial from './SpeckleDepthMaterial.js'

class SpeckleDepthNormalMaterial extends SpeckleDepthMaterial {
  protected get vertexProgram(): string {
    return speckleDepthNormalVert
  }

  protected get fragmentProgram(): string {
    return speckleDepthNormalFrag
  }
}

export default SpeckleDepthNormalMaterial
