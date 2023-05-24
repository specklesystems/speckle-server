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
  IUniform
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'

import { Uniforms } from './SpeckleStandardMaterial'
import { ExtendedMeshBasicMaterial } from './SpeckleMaterial'

class SpeckleBasicMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()

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
      objCount: 1,
      billboardPos: new Vector3()
    }
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

  public copyOriginal(source) {
    super.copy(source)
    this.copyFrom(source)
    return this
  }

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
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

    this.userData.uViewer_low.value.copy(SpeckleBasicMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleBasicMaterial.vecBuff2)

    if (object instanceof SpeckleMesh)
      (object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleBasicMaterial
