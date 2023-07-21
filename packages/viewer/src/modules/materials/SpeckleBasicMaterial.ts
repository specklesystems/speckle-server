/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleBasicVert } from './shaders/speckle-basic-vert'
import { speckleBasicFrag } from './shaders/speckle-basic-frag'
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
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'

import { ExtendedMeshBasicMaterial, Uniforms } from './SpeckleMaterial'

class SpeckleBasicMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()
  protected static readonly vecBuff3: Vector2 = new Vector2()

  private _billboardPixelHeight: number

  protected get vertexShader(): string {
    return speckleBasicVert
  }

  protected get fragmentShader(): string {
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
  }

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (this.defines['BILLBOARD_FIXED']) {
      const resolution = _this.getDrawingBufferSize(SpeckleBasicMaterial.vecBuff3)
      SpeckleBasicMaterial.vecBuff3.set(
        (this._billboardPixelHeight / resolution.x) * 2,
        (this._billboardPixelHeight / resolution.y) * 2
      )
      this.userData.billboardSize.value.copy(SpeckleBasicMaterial.vecBuff3)
      SpeckleBasicMaterial.matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(SpeckleBasicMaterial.matBuff)
    }

    if (this.defines['USE_RTE']) {
      SpeckleBasicMaterial.matBuff.copy(camera.matrixWorldInverse)
      SpeckleBasicMaterial.matBuff.elements[12] = 0
      SpeckleBasicMaterial.matBuff.elements[13] = 0
      SpeckleBasicMaterial.matBuff.elements[14] = 0
      object.modelViewMatrix.copy(SpeckleBasicMaterial.matBuff)

      SpeckleBasicMaterial.vecBuff0.set(
        camera.matrixWorld.elements[12],
        camera.matrixWorld.elements[13],
        camera.matrixWorld.elements[14]
      )

      Geometry.DoubleToHighLowVector(
        SpeckleBasicMaterial.vecBuff0,
        SpeckleBasicMaterial.vecBuff1,
        SpeckleBasicMaterial.vecBuff2
      )
    }

    this.userData.uViewer_low.value.copy(SpeckleBasicMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleBasicMaterial.vecBuff2)

    if (object instanceof SpeckleMesh)
      (object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleBasicMaterial
