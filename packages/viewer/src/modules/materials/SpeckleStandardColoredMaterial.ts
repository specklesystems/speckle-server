/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardColoredVert } from './shaders/speckle-standard-colored-vert'
import { speckleStandardColoredFrag } from './shaders/speckle-standard-colored-frag'
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

class SpeckleStandardColoredMaterial extends MeshStandardMaterial {
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
    ;(this as any).vertProgram = speckleStandardColoredVert
    ;(this as any).fragProgram = speckleStandardColoredFrag
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
      SpeckleStandardColoredMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleStandardColoredMaterial.matBuff.elements[12] = 0
      SpeckleStandardColoredMaterial.matBuff.elements[13] = 0
      SpeckleStandardColoredMaterial.matBuff.elements[14] = 0
      SpeckleStandardColoredMaterial.matBuff.multiply(object.matrixWorld)
      object.modelViewMatrix.copy(SpeckleStandardColoredMaterial.matBuff)

      SpeckleStandardColoredMaterial.vecBuff0.set(
        camera.matrixWorld.elements[12],
        camera.matrixWorld.elements[13],
        camera.matrixWorld.elements[14]
      )

      Geometry.DoubleToHighLowVector(
        SpeckleStandardColoredMaterial.vecBuff0,
        SpeckleStandardColoredMaterial.vecBuff1,
        SpeckleStandardColoredMaterial.vecBuff2
      )

      this.userData.uViewer_low.value.copy(SpeckleStandardColoredMaterial.vecBuff1)
      this.userData.uViewer_high.value.copy(SpeckleStandardColoredMaterial.vecBuff2)
      this.needsUpdate = true
    }
  }
}

export default SpeckleStandardColoredMaterial
