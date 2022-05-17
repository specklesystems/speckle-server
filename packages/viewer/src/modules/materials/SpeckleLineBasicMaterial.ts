import { speckle_line_basic_vert } from './shaders/speckle-line-basic-vert'
import { speckle_line_basic_frag } from './shaders/speckle-line-basic-frag'
import { UniformsUtils, ShaderLib, Vector3, LineBasicMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleLineBasicMaterial extends LineBasicMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()

  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckle_line_basic_vert
    ;(this as any).fragProgram = speckle_line_basic_frag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.line.uniforms,
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

    for (var k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ''
    }

    if (Geometry.USE_RTE) {
      this.defines = {}
      this.defines['USE_RTE'] = ' '
    }
  }

  copy(source) {
    super.copy(source)
    this.userData = {}
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (Geometry.USE_RTE) {
      SpeckleLineBasicMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleLineBasicMaterial.matBuff.elements[12] = 0
      SpeckleLineBasicMaterial.matBuff.elements[13] = 0
      SpeckleLineBasicMaterial.matBuff.elements[14] = 0
      SpeckleLineBasicMaterial.matBuff.multiply(object.matrixWorld)
      object.modelViewMatrix.copy(SpeckleLineBasicMaterial.matBuff)

      let uViewer_low = new Vector3()
      let uViewer_high = new Vector3()
      let uViewer = new Vector3(
        camera.matrixWorld.elements[12],
        camera.matrixWorld.elements[13],
        camera.matrixWorld.elements[14]
      )

      Geometry.DoubleToHighLowVector(uViewer, uViewer_low, uViewer_high)
      this.userData.uViewer_high.value.copy(uViewer_high)
      this.userData.uViewer_low.value.copy(uViewer_low)
      this.needsUpdate = true
    }
  }
}

export default SpeckleLineBasicMaterial
