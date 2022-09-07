/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDepthVert } from './shaders/speckle-depth-vert'
import { speckleDepthFrag } from './shaders/speckle-depth-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshDepthMaterial, Material } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleDepthMaterial extends MeshDepthMaterial {
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
    this.userData.rteModelViewMatrix = {
      value: new Matrix4()
    }
    ;(this as any).vertProgram = speckleDepthVert
    ;(this as any).fragProgram = speckleDepthFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        rteModelViewMatrix: {
          value: this.userData.rteModelViewMatrix.value
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.rteModelViewMatrix = this.userData.rteModelViewMatrix
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

  /** A note here:
   *  We need to do this, becuse three creates clones behind the scenes when the depth material
   *  has clipping planes enabled. Those clones do not have the user data bound anymore so we
   *  end up not being able to update our custom uniforms, meaning nothing will work right
   *  Dick move from three.js doing dirty stuff like this behind our back.
   */
  clone(): this {
    const ret = super.clone()
    ret.userData.uViewer_high = this.userData.uViewer_high
    ret.userData.uViewer_low = this.userData.uViewer_low
    ret.userData.rteModelViewMatrix = this.userData.rteModelViewMatrix
    return ret
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
    this.userData.rteModelViewMatrix = {
      value: new Matrix4()
    }
    this.defines['USE_RTE'] = ' '

    return this
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleDepthMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleDepthMaterial.matBuff.elements[12] = 0
    SpeckleDepthMaterial.matBuff.elements[13] = 0
    SpeckleDepthMaterial.matBuff.elements[14] = 0
    SpeckleDepthMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleDepthMaterial.matBuff)

    SpeckleDepthMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleDepthMaterial.vecBuff0,
      SpeckleDepthMaterial.vecBuff1,
      SpeckleDepthMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleDepthMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleDepthMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpeckleDepthMaterial
