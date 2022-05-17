import { speckle_standard_vert } from './shaders/speckle-standard-vert'
import { speckle_standard_frag } from './shaders/speckle-standard-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshStandardMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleStandardMaterial extends MeshStandardMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckle_standard_vert
    ;(this as any).fragProgram = speckle_standard_frag
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

    for (var k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ''
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
    SpeckleStandardMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleStandardMaterial.matBuff.elements[12] = 0
    SpeckleStandardMaterial.matBuff.elements[13] = 0
    SpeckleStandardMaterial.matBuff.elements[14] = 0
    SpeckleStandardMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleStandardMaterial.matBuff)

    let uViewer_low = new Vector3()
    let uViewer_high = new Vector3()
    let uViewer = new Vector3(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLow(uViewer, uViewer_low, uViewer_high)
    object.frustumCulled = false
    this.userData.uViewer_high.value.copy(uViewer_high)
    this.userData.uViewer_low.value.copy(uViewer_low)
    this.needsUpdate = true
  }
}

export default SpeckleStandardMaterial
