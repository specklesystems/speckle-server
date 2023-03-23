/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardVert } from './shaders/speckle-standard-vert'
import { speckleStandardFrag } from './shaders/speckle-standard-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshStandardMaterial,
  Material
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'

class SpeckleStandardMaterial extends MeshStandardMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexShader(): string {
    return speckleStandardVert
  }

  protected get fragmentShader(): string {
    return speckleStandardFrag
  }

  constructor(parameters, defines = []) {
    super(parameters)

    this.defineUniforms()
    this['uniforms'] = this.getAllUniforms()

    if (defines) {
      this.defines = {}
    }
    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ' '
    }
  }

  protected defineUniforms() {
    this.userData.uViewer_high = {
      value: new Vector3()
    }
    this.userData.uViewer_low = {
      value: new Vector3()
    }
    this.userData.rteShadowMatrix = {
      value: new Matrix4()
    }
    this.userData.uShadowViewer_high = {
      value: new Vector3()
    }
    this.userData.uShadowViewer_low = {
      value: new Vector3()
    }
    this.userData.uTransforms = {
      value: [new Matrix4()]
    }
    this.userData.tTransforms = {
      value: null
    }
  }

  protected getAllUniforms() {
    return UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        uViewer_high: {
          value: this.userData.uViewer_high.value
        },
        uViewer_low: {
          value: this.userData.uViewer_low.value
        },
        rteShadowMatrix: {
          value: this.userData.rteShadowMatrix.value
        },
        uShdowViewer_high: {
          value: this.userData.uShadowViewer_high.value
        },
        uShadowViewer_low: {
          value: this.userData.uShadowViewer_low.value
        },
        uTransforms: {
          value: this.userData.uTransforms.value
        },
        tTransforms: {
          value: this.userData.tTransforms.value
        }
      }
    ])
  }

  public onBeforeCompile(shader, renderer) {
    shader.uniforms.uViewer_high = this.userData.uViewer_high
    shader.uniforms.uViewer_low = this.userData.uViewer_low
    shader.uniforms.rteShadowMatrix = this.userData.rteShadowMatrix
    shader.uniforms.uShadowViewer_high = this.userData.uShadowViewer_high
    shader.uniforms.uShadowViewer_low = this.userData.uShadowViewer_low
    shader.uniforms.uTransforms = this.userData.uTransforms
    shader.uniforms.tTransforms = this.userData.tTransforms
    shader.vertexShader = this.vertexShader
    shader.fragmentShader = this.fragmentShader
  }

  public copy(source) {
    super.copy(source)
    this.userData = {}
    this.defineUniforms()

    Object.assign(this.defines, source.defines)

    return this
  }

  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleStandardMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleStandardMaterial.matBuff.elements[12] = 0
    SpeckleStandardMaterial.matBuff.elements[13] = 0
    SpeckleStandardMaterial.matBuff.elements[14] = 0
    SpeckleStandardMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleStandardMaterial.matBuff)

    SpeckleStandardMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleStandardMaterial.vecBuff0,
      SpeckleStandardMaterial.vecBuff1,
      SpeckleStandardMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleStandardMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleStandardMaterial.vecBuff2)
    ;(object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }

  private getUniforms(gl, material: Material) {
    const materialProperties = gl.properties.get(this)
    if (materialProperties.currentProgram) {
      console.warn(materialProperties.currentProgram.getUniforms())
    }
  }
}

export default SpeckleStandardMaterial
