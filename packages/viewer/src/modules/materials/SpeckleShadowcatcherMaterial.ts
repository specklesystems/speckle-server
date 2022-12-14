/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleShadowcatcherVert } from './shaders/speckle-shadowcatcher-vert'
import { speckleShadowcatcherFrag } from './shaders/speckle-shadowcatche-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'
import { ShaderLib, UniformsUtils, Vector3 } from 'three'

class SpeckleShadowcatcherMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters, defines)
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
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

export default SpeckleShadowcatcherMaterial
