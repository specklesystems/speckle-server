import { speckle_lambert_vert } from './shaders/speckle-lambert-vert'
import { speckle_lambert_frag } from './shaders/speckle-lambert-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshLambertMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleLambertMaterial extends MeshLambertMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckle_lambert_vert
    ;(this as any).fragProgram = speckle_lambert_frag
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

    if (Geometry.USE_RTE) {
      this.defines['USE_RTE'] = ' '
    }

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (Geometry.USE_RTE) {
      SpeckleLambertMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleLambertMaterial.matBuff.elements[12] = 0
      SpeckleLambertMaterial.matBuff.elements[13] = 0
      SpeckleLambertMaterial.matBuff.elements[14] = 0
      SpeckleLambertMaterial.matBuff.multiply(object.matrixWorld)
      object.modelViewMatrix.copy(SpeckleLambertMaterial.matBuff)

      let uViewer_low = new Vector3()
      let uViewer_high = new Vector3()
      let uViewer = new Vector3(
        camera.matrixWorld.elements[12],
        camera.matrixWorld.elements[13],
        camera.matrixWorld.elements[14]
      )

      Geometry.DoubleToHighLowVector(uViewer, uViewer_low, uViewer_high)
      object.frustumCulled = false
      this.userData.uViewer_high.value.copy(uViewer_high)
      this.userData.uViewer_low.value.copy(uViewer_low)
      this.needsUpdate = true
    }
  }
}

export default SpeckleLambertMaterial
