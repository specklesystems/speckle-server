/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleNormalVert } from './shaders/speckle-normal-vert'
import { speckleNormalFrag } from './shaders/speckle-normal-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshNormalMaterial } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleNormalMaterial extends MeshNormalMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()

  constructor(parameters, defines = []) {
    super(parameters)

    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    ;(this as any).vertProgram = speckleNormalVert
    ;(this as any).fragProgram = speckleNormalFrag
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
    SpeckleNormalMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleNormalMaterial.matBuff.elements[12] = 0
    SpeckleNormalMaterial.matBuff.elements[13] = 0
    SpeckleNormalMaterial.matBuff.elements[14] = 0
    SpeckleNormalMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleNormalMaterial.matBuff)

    SpeckleNormalMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleNormalMaterial.vecBuff0,
      SpeckleNormalMaterial.vecBuff1,
      SpeckleNormalMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleNormalMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleNormalMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpeckleNormalMaterial
