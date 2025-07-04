/* eslint-disable camelcase */
import { speckleBasicVert } from './shaders/speckle-basic-vert.js'
import { speckleBasicFrag } from './shaders/speckle-basic-frag.js'
import {
  ShaderLib,
  Vector3,
  Material,
  type IUniform,
  Vector2,
  type MeshBasicMaterialParameters,
  Scene,
  Camera,
  BufferGeometry,
  Object3D,
  Vector4
} from 'three'
import { Matrix4 } from 'three'

import { ExtendedMeshBasicMaterial, type Uniforms } from './SpeckleMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

const matBuff: Matrix4 = new Matrix4()
const vec2Buff0: Vector2 = new Vector2()
const vec2Buff1: Vector2 = new Vector2()
const vec2Buff2: Vector2 = new Vector2()

export type BillboardingType = 'world' | 'screen'

class SpeckleBasicMaterial extends ExtendedMeshBasicMaterial {
  protected _billboardPixelSize: Vector2 = new Vector2()
  protected _billboardPixelOffset: Vector2 = new Vector2()

  protected get vertexProgram(): string {
    return speckleBasicVert
  }

  protected get fragmentProgram(): string {
    return speckleBasicFrag
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
      invProjection: new Matrix4(),
      billboardPixelOffsetSize: new Vector4()
    }
  }

  public get billboardPixelSize(): Vector2 {
    return this._billboardPixelSize
  }

  public set billboardPixelSize(value: Vector2) {
    this._billboardPixelSize.copy(value)
  }

  public get billboardPixeOffset(): Vector2 {
    return this._billboardPixelOffset
  }

  public set billboardPixelOffset(value: Vector2) {
    this._billboardPixelOffset.copy(value)
  }

  constructor(parameters: MeshBasicMaterialParameters, defines: string[] = []) {
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

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as SpeckleBasicMaterial
    const fromStandard = from as SpeckleBasicMaterial
    toStandard.color.copy(fromStandard.color)
    to.userData.billboardPixelOffsetSize.value.copy(
      from.userData.billboardPixelOffsetSize.value
    )
  }

  public setBillboarding(type: BillboardingType | null) {
    /** Create the define object if not there */
    if (!this.defines) this.defines = {}
    /** Clear all billboarding defines */
    delete this.defines['BILLBOARD_SCREEN']
    delete this.defines['BILLBOARD']

    if (!type) return

    if (type === 'world') this.defines['BILLBOARD'] = ' '
    if (type === 'screen') this.defines['BILLBOARD_SCREEN'] = ' '
  }

  /** Called by three.js render loop */
  public onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    if (
      this.defines &&
      (this.defines['BILLBOARD'] || this.defines['BILLBOARD_SCREEN'])
    ) {
      matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(matBuff)
      this.needsUpdate = true
    }

    if (this.defines && this.defines['BILLBOARD_SCREEN']) {
      _this.getDrawingBufferSize(vec2Buff0)
      const billboardPixelOffsetNDC = vec2Buff1.set(
        this._billboardPixelOffset.x,
        this._billboardPixelOffset.y
      )
      const billboardPixelSizeNDC = vec2Buff2.set(
        this._billboardPixelSize.x,
        this._billboardPixelSize.y
      )
      billboardPixelOffsetNDC.divide(vec2Buff0)
      billboardPixelSizeNDC.divide(vec2Buff0)
      this.userData.billboardPixelOffsetSize.value.set(
        billboardPixelOffsetNDC.x,
        billboardPixelOffsetNDC.y,
        billboardPixelSizeNDC.x,
        billboardPixelSizeNDC.y
      )
      this.needsUpdate = true
    }

    if (this.defines && this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
      this.needsUpdate = true
    }
  }
}

export default SpeckleBasicMaterial
