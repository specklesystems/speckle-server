/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleLineVert } from './shaders/speckle-line-vert'
import { speckleLineFrag } from './shaders/speckle-line-frag'
import { UniformsUtils, ShaderLib, Vector3, Vector2 } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

class SpeckleLineMaterial extends LineMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

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
    ;(this as any).vertProgram = speckleLineVert
    ;(this as any).fragProgram = speckleLineFrag
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

    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ' '
    }

    // this.defines['USE_RTE'] = ' '
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
    SpeckleLineMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleLineMaterial.matBuff.elements[12] = 0
    SpeckleLineMaterial.matBuff.elements[13] = 0
    SpeckleLineMaterial.matBuff.elements[14] = 0
    // SpeckleLineMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleLineMaterial.matBuff)

    SpeckleLineMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleLineMaterial.vecBuff0,
      SpeckleLineMaterial.vecBuff1,
      SpeckleLineMaterial.vecBuff2
    )
    this.userData.uViewer_low.value.copy(SpeckleLineMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleLineMaterial.vecBuff2)
    _this.getDrawingBufferSize(this.resolution)
    this.needsUpdate = true
  }
}

export default SpeckleLineMaterial
