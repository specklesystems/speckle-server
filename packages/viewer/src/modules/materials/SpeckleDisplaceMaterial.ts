/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDisplaceVert } from './shaders/speckle-displace.vert'
import { speckleDisplaceFrag } from './shaders/speckle-displace-frag'
import { Vector2 } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { Uniforms } from './SpeckleMaterial'

class SpeckleDisplaceMaterial extends SpeckleBasicMaterial {
  protected get vertexShader(): string {
    return speckleDisplaceVert
  }

  protected get fragmentShader(): string {
    return speckleDisplaceFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, size: new Vector2(), displacement: 0 }
  }

  constructor(parameters, defines = []) {
    super(parameters, defines)
  }
}

export default SpeckleDisplaceMaterial
