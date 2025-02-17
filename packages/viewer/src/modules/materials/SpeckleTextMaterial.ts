/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleTextVert } from './shaders/speckle-text-vert.js'
import { speckleTextFrag } from './shaders/speckle-text-frag.js'
import {
  ShaderLib,
  Vector3,
  type IUniform,
  Vector2,
  Material,
  type MeshBasicMaterialParameters,
  Scene,
  Camera,
  BufferGeometry,
  Object3D
} from 'three'
import { Matrix4 } from 'three'

import { ExtendedMeshBasicMaterial, type Uniforms } from './SpeckleMaterial.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { createTextDerivedMaterial } from 'troika-three-text'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleTextMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff: Vector2 = new Vector2()

  private _billboardPixelHeight!: number

  protected get vertexProgram(): string {
    return speckleTextVert
  }

  protected get fragmentProgram(): string {
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

  constructor(parameters: MeshBasicMaterialParameters, defines: Array<string> = []) {
    super(parameters)
    this.init(defines)
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    return this.constructor.name
  }

  public copy(source: Material) {
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

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as SpeckleTextMaterial
    const fromStandard = from as SpeckleTextMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.refractionRatio = fromStandard.refractionRatio
    to.userData.billboardPos.value.copy(from.userData.billboardPos.value)
  }

  /** Called by three.js render loop */
  public onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    camera: Camera,
    _geometry: BufferGeometry,
    _object: Object3D
  ) {
    if (this.defines && this.defines['BILLBOARD_FIXED']) {
      const resolution = _this.getDrawingBufferSize(SpeckleTextMaterial.vecBuff)
      SpeckleTextMaterial.vecBuff.set(
        (this._billboardPixelHeight / resolution.x) * 2,
        (this._billboardPixelHeight / resolution.y) * 2
      )
      this.userData.billboardSize.value.copy(SpeckleTextMaterial.vecBuff)
      SpeckleTextMaterial.matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(SpeckleTextMaterial.matBuff)
    }
    /** TO ENABLE */
    // object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    // this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    // this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
    this.needsUpdate = true
  }
}

export default SpeckleTextMaterial
