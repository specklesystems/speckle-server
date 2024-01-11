/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleBasicVert } from './shaders/speckle-basic-vert'
import { speckleBasicFrag } from './shaders/speckle-basic-frag'
import { ShaderLib, Vector3, Material, IUniform, Vector2 } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'

import { ExtendedMeshBasicMaterial, Uniforms } from './SpeckleMaterial'

class SpeckleBasicMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff: Vector2 = new Vector2()

  private _billboardPixelHeight: number

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
      billboardPos: new Vector3(),
      billboardSize: new Vector2(),
      invProjection: new Matrix4(),
      objCount: 1
    }
  }

  public set billboardPixelHeight(value: number) {
    this._billboardPixelHeight = value
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

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as SpeckleBasicMaterial
    const fromStandard = from as SpeckleBasicMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.refractionRatio = fromStandard.refractionRatio
    to.userData.billboardPos.value.copy(from.userData.billboardPos.value)
  }

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (this.defines['BILLBOARD_FIXED']) {
      const resolution = _this.getDrawingBufferSize(SpeckleBasicMaterial.vecBuff)
      SpeckleBasicMaterial.vecBuff.set(
        (this._billboardPixelHeight / resolution.x) * 2,
        (this._billboardPixelHeight / resolution.y) * 2
      )
      this.userData.billboardSize.value.copy(SpeckleBasicMaterial.vecBuff)
      SpeckleBasicMaterial.matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(SpeckleBasicMaterial.matBuff)
    }

    if (this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
    }

    this.needsUpdate = true
  }
}

export default SpeckleBasicMaterial
