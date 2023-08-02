/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleTextVert } from './shaders/speckle-text-vert'
import { speckleTextFrag } from './shaders/speckle-text-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshBasicMaterial,
  Material,
  IUniform,
  Vector2
} from 'three'
import { Matrix4 } from 'three'

import { ExtendedMeshBasicMaterial, Uniforms } from './SpeckleMaterial'
import { createTextDerivedMaterial } from 'troika-three-text'

class SpeckleTextMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()
  protected static readonly vecBuff3: Vector2 = new Vector2()

  private _billboardPixelHeight: number

  protected get vertexShader(): string {
    return speckleTextVert
  }

  protected get fragmentShader(): string {
    return speckleTextFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.basic.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1,
      billboardPos: new Vector3(),
      billboardSize: new Vector2(),
      invProjection: new Matrix4()
    }
  }

  public set billboardPixelHeight(value: number) {
    this._billboardPixelHeight = value
  }

  public get billboardPixelHeight() {
    return this._billboardPixelHeight
  }

  constructor(parameters, defines = []) {
    super(parameters)
    this.init(defines)
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    return this.constructor.name
  }

  public copy(source) {
    super.copy(source)
    this.copyFrom(source)
    return this
  }

  public getDerivedMaterial() {
    const derived = createTextDerivedMaterial(this)
    /** We rebind the uniforms */
    for (const k in this.userData) {
      derived.uniforms[k] = this.userData[k]
    }

    return derived
  }

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (this.defines['BILLBOARD_FIXED']) {
      const resolution = _this.getDrawingBufferSize(SpeckleTextMaterial.vecBuff3)
      SpeckleTextMaterial.vecBuff3.set(
        (this._billboardPixelHeight / resolution.x) * 2,
        (this._billboardPixelHeight / resolution.y) * 2
      )
      this.userData.billboardSize.value.copy(SpeckleTextMaterial.vecBuff3)
      SpeckleTextMaterial.matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(SpeckleTextMaterial.matBuff)
    }
    /** TO ENABLE */
    // SpeckleTextMaterial.matBuff.copy(camera.matrixWorldInverse)
    // SpeckleTextMaterial.matBuff.elements[12] = 0
    // SpeckleTextMaterial.matBuff.elements[13] = 0
    // SpeckleTextMaterial.matBuff.elements[14] = 0
    // object.modelViewMatrix.copy(SpeckleTextMaterial.matBuff)
    // SpeckleTextMaterial.vecBuff0.set(
    //   camera.matrixWorld.elements[12],
    //   camera.matrixWorld.elements[13],
    //   camera.matrixWorld.elements[14]
    // )
    // Geometry.DoubleToHighLowVector(
    //   SpeckleTextMaterial.vecBuff0,
    //   SpeckleTextMaterial.vecBuff1,
    //   SpeckleTextMaterial.vecBuff2
    // )
    // this.userData.uViewer_low.value.copy(SpeckleTextMaterial.vecBuff1)
    // this.userData.uViewer_high.value.copy(SpeckleTextMaterial.vecBuff2)
    // this.needsUpdate = true
  }
}

export default SpeckleTextMaterial
