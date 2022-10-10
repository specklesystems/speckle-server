/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { specklePointVert } from './shaders/speckle-point-vert'
import { specklePointFrag } from './shaders/speckle-point-frag'
import { Matrix4, PointsMaterial, ShaderLib, UniformsUtils, Vector3 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpecklePointMaterial extends PointsMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

  constructor(parameters, defines = []) {
    super(parameters)
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = specklePointVert
    ;(this as any).fragProgram = specklePointFrag
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

    this.defines['USE_RTE'] = ' '

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpecklePointMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpecklePointMaterial.matBuff.elements[12] = 0
    SpecklePointMaterial.matBuff.elements[13] = 0
    SpecklePointMaterial.matBuff.elements[14] = 0
    SpecklePointMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpecklePointMaterial.matBuff)

    SpecklePointMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpecklePointMaterial.vecBuff0,
      SpecklePointMaterial.vecBuff1,
      SpecklePointMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpecklePointMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpecklePointMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpecklePointMaterial
