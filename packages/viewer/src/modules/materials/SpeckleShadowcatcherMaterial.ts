/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { Vector4 } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { Uniforms } from './SpeckleMaterial'
import { speckleShadowcatcherFrag } from './shaders/speckle-shadowcatche-frag'
import { speckleShadowcatcherVert } from './shaders/speckle-shadowcatcher-vert'

class SpeckleShadowcatcherMaterial extends SpeckleBasicMaterial {
  protected get vertexShader(): string {
    return speckleShadowcatcherVert
  }

  protected get fragmentShader(): string {
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
