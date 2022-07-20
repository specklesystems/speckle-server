/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardGradientVert } from './shaders/speckle-standard-gradient-vert'
import { speckleStandardGradientFrag } from './shaders/speckle-standard-gradient-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshStandardMaterial,
  Texture,
  NearestFilter
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

class SpeckleStandardGradientMaterial extends MeshStandardMaterial {
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
    this.userData.gradientRamp = {
      value: null
    }
    ;(this as any).vertProgram = speckleStandardGradientVert
    ;(this as any).fragProgram = speckleStandardGradientFrag
    ;(this as any).uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        gradientRamp: {
          value: this.userData.gradientRamp
        }
      }
    ])

    this.onBeforeCompile = function (shader) {
      shader.uniforms.uViewer_high = this.userData.uViewer_high
      shader.uniforms.uViewer_low = this.userData.uViewer_low
      shader.uniforms.gradientRamp = this.userData.gradientRamp
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

    if (Geometry.USE_RTE) {
      this.defines['USE_RTE'] = ' '
    }

    return this
  }

  public setGradientTexture(texture: Texture) {
    this.userData.gradientRamp.value = texture
    this.userData.gradientRamp.value.generateMipmaps = false
    this.userData.gradientRamp.value.minFilter = NearestFilter
    this.userData.gradientRamp.value.magFilter = NearestFilter
    this.needsUpdate = true
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (Geometry.USE_RTE) {
      SpeckleStandardGradientMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleStandardGradientMaterial.matBuff.elements[12] = 0
      SpeckleStandardGradientMaterial.matBuff.elements[13] = 0
      SpeckleStandardGradientMaterial.matBuff.elements[14] = 0
      SpeckleStandardGradientMaterial.matBuff.multiply(object.matrixWorld)
      object.modelViewMatrix.copy(SpeckleStandardGradientMaterial.matBuff)

      SpeckleStandardGradientMaterial.vecBuff0.set(
        camera.matrixWorld.elements[12],
        camera.matrixWorld.elements[13],
        camera.matrixWorld.elements[14]
      )

      Geometry.DoubleToHighLowVector(
        SpeckleStandardGradientMaterial.vecBuff0,
        SpeckleStandardGradientMaterial.vecBuff1,
        SpeckleStandardGradientMaterial.vecBuff2
      )

      this.userData.uViewer_low.value.copy(SpeckleStandardGradientMaterial.vecBuff1)
      this.userData.uViewer_high.value.copy(SpeckleStandardGradientMaterial.vecBuff2)
      this.needsUpdate = true
    }
  }
}

export default SpeckleStandardGradientMaterial
