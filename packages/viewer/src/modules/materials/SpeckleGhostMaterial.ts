/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { Matrix4, ShaderLib, UniformsUtils, Vector3 } from 'three'
import { speckleBasicVert } from './shaders/speckle-basic-vert'
import { speckleBasicFrag } from './shaders/speckle-basic-frag'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'

class SpeckleGhostMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters)
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckleBasicVert
    ;(this as any).fragProgram = speckleBasicFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
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

    this.defines['NO_SHADOWS'] = ''
  }
}

export default SpeckleGhostMaterial
