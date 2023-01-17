/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleShadowcatcherVert } from './shaders/speckle-shadowcatcher-vert'
import { speckleShadowcatcherFrag } from './shaders/speckle-shadowcatche-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { ShaderLib, UniformsUtils, Vector3, Vector4 } from 'three'

class SpeckleShadowcatcherMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters, defines)
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    this.userData.tex0 = {
      value: null
    }
    this.userData.tex1 = {
      value: null
    }
    this.userData.tex2 = {
      value: null
    }
    this.userData.tex3 = {
      value: null
    }
    this.userData.weights = {
      value: new Vector4()
    }
    this.userData.sigmoidRange = {
      value: 0
    }
    this.userData.sigmoidStrength = {
      value: 0
    }
    ;(this as any).vertProgram = speckleShadowcatcherVert
    ;(this as any).fragProgram = speckleShadowcatcherFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.basic.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        tex0: {
          value: this.userData.tex0.value
        },
        tex1: {
          value: this.userData.tex1.value
        },
        tex2: {
          value: this.userData.tex2.value
        },
        tex3: {
          value: this.userData.tex3.value
        },
        weights: {
          value: this.userData.weights.value
        },
        sigmoidRange: {
          value: this.userData.sigmoidRange.value
        },
        sigmoidStrength: {
          value: this.userData.sigmoidStrength.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.tex0 = this.userData.tex0
      shader.uniforms.tex1 = this.userData.tex1
      shader.uniforms.tex2 = this.userData.tex2
      shader.uniforms.tex3 = this.userData.tex3
      shader.uniforms.weights = this.userData.weights
      shader.uniforms.sigmoidRange = this.userData.sigmoidRange
      shader.uniforms.sigmoidStrength = this.userData.sigmoidStrength
      shader.vertexShader = this.vertProgram
      shader.fragmentShader = this.fragProgram
    }

    if (defines) {
      this.defines = {}
    }
    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ' '
    }
  }
}

export default SpeckleShadowcatcherMaterial
