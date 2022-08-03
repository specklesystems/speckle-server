/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleLineBasicVert } from './shaders/speckle-line-basic-vert'
import { speckleLineBasicFrag } from './shaders/speckle-line-basic-frag'
import { UniformsUtils, ShaderLib, Vector3, LineBasicMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleLineBasicMaterial extends LineBasicMaterial {
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
    ;(this as any).vertProgram = speckleLineBasicVert
    ;(this as any).fragProgram = speckleLineBasicFrag
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

    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ''
    }

    this.defines = {}
    this.defines['USE_RTE'] = ' '
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
    SpeckleLineBasicMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleLineBasicMaterial.matBuff.elements[12] = 0
    SpeckleLineBasicMaterial.matBuff.elements[13] = 0
    SpeckleLineBasicMaterial.matBuff.elements[14] = 0
    SpeckleLineBasicMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleLineBasicMaterial.matBuff)

    SpeckleLineBasicMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleLineBasicMaterial.vecBuff0,
      SpeckleLineBasicMaterial.vecBuff1,
      SpeckleLineBasicMaterial.vecBuff2
    )
    this.userData.uViewer_low.value.copy(SpeckleLineBasicMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleLineBasicMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpeckleLineBasicMaterial
