/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleShadowcatcherGenerateVert } from './shaders/speckle-shadowcatcher-generate-vert'
import { speckleShadowcatcherGenerateFrag } from './shaders/speckle-shadowcatcher-generate-frag'
import { UniformsUtils, ShaderLib, Vector3 } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'

class SpeckleShadowcatcherGenerateMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters, defines)
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckleShadowcatcherGenerateVert
    ;(this as any).fragProgram = speckleShadowcatcherGenerateFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.basic.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
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

export default SpeckleShadowcatcherGenerateMaterial
