import { speckleShadowcatcherVert } from './shaders/speckle-shadowcatcher-vert'
import { speckleShadowcatcherFrag } from './shaders/speckle-shadowcatche-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { Vector4 } from 'three'
import { Uniforms } from './SpeckleMaterial'

class SpeckleShadowcatcherMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleShadowcatcherVert
  }

  protected get fragmentProgram(): string {
    return speckleShadowcatcherFrag
  }

  protected get uniformsDef(): Uniforms {
    return {
      ...super.uniformsDef,
      tex0: null,
      tex1: null,
      tex2: null,
      tex3: null,
      weights: new Vector4(),
      sigmoidRange: 0,
      sigmoidStrength: 0
    }
  }

  constructor(parameters, defines = []) {
    super(parameters, defines)
  }
}

export default SpeckleShadowcatcherMaterial
