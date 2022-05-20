import { speckle_line_vert } from './shaders/speckle-line-vert'
import { speckle_line_frag } from './shaders/speckle-line-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshStandardMaterial,
  Box3,
  Camera,
  Mesh,
  Object3D,
  Vector4,
  Vector2,
  PerspectiveCamera,
  OrthographicCamera
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

class SpeckleLineMaterial extends LineMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()

  public set pixelThreshold(value: number) {
    this.userData.pixelThreshold.value = value
    this.needsUpdate = true
  }

  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    this.userData.pixelThreshold = {
      value: 0
    }
    ;(this as any).vertProgram = speckle_line_vert
    ;(this as any).fragProgram = speckle_line_frag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.line.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        pixelThreshold: {
          value: this.userData.pixelThreshold
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.pixelThreshold = this.userData.pixelThreshold
      shader.vertexShader = this.vertProgram
      shader.fragmentShader = this.fragProgram
    }

    for (var k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ''
    }

    if (Geometry.USE_RTE) {
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
    this.userData.pixelThreshold = {
      value: source.userData.pixelThreshold.value
    }

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (Geometry.USE_RTE) {
      SpeckleLineMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleLineMaterial.matBuff.elements[12] = 0
      SpeckleLineMaterial.matBuff.elements[13] = 0
      SpeckleLineMaterial.matBuff.elements[14] = 0
      SpeckleLineMaterial.matBuff.multiply(object.matrixWorld)
      object.modelViewMatrix.copy(SpeckleLineMaterial.matBuff)

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

export default SpeckleLineMaterial
