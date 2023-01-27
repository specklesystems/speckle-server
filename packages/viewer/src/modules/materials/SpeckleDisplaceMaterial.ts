/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDisplaceVert } from './shaders/speckle-displace.vert'
import { speckleDisplaceFrag } from './shaders/speckle-displace-frag'
import { UniformsUtils, ShaderLib, Vector3, Vector2 } from 'three'
import SpeckleBasicMaterial from './SpeckleBasicMaterial'

class SpeckleDisplaceMaterial extends SpeckleBasicMaterial {
  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    this.userData.size = {
      value: new Vector2()
    }
    this.userData.displacement = {
      value: 0
    }
    ;(this as any).vertProgram = speckleDisplaceVert
    ;(this as any).fragProgram = speckleDisplaceFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        size: {
          value: this.userData.size.value
        },
        displacement: {
          value: this.userData.displacement.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.size = this.userData.size
      shader.uniforms.displacement = this.userData.displacement
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

export default SpeckleDisplaceMaterial
