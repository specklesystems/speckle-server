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

export type Uniforms = Record<string, any>

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

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      rteShadowMatrix: new Matrix4(),
      uShadowViewer_high: new Vector3(),
      uShadowViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null
    }
  }

  constructor(parameters, defines = []) {
    super(parameters)

    this.setUniforms(this.uniformsDef)

    if (defines) {
      this.defines = {}
    }
    for (let k = 0; k < defines.length; k++) {
      this.defines[defines[k]] = ' '
    }

    this.onBeforeCompile = this.onCompile
  }

  protected setUniforms(def: Uniforms) {
    for (const k in def) {
      this.userData[k] = {
        value: def[k]
      }
    }
    this['uniforms'] = UniformsUtils.merge([ShaderLib.standard.uniforms, this.userData])
  }

  protected onCompile(shader, renderer) {
    for (const k in this.uniformsDef) {
      shader.uniforms[k] = this.userData[k]
    }
    shader.vertexShader = this.vertexShader
    shader.fragmentShader = this.fragmentShader
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    /** Bruh... */
    // return this.onBeforeCompile.toString()
    return this.constructor.name
  }

  public copy(source) {
    super.copy(source)
    this.userData = {}
    this.setUniforms(this.uniformsDef)

    Object.assign(this.defines, source.defines)

    return this
  }

  /** Called by three.js render loop */
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

  private getRuntimeUniforms(gl, material: Material) {
    const materialProperties = gl.properties.get(this)
    if (materialProperties.currentProgram) {
      console.warn(materialProperties.currentProgram.getUniforms())
    }
  }
}

export default SpeckleStandardMaterial
