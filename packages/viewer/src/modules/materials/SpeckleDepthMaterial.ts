/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDepthVert } from './shaders/speckle-depth-vert'
import { speckleDepthFrag } from './shaders/speckle-depth-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshDepthMaterial,
  Material,
  IUniform
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedMeshDepthMaterial, Uniforms } from './SpeckleMaterial'

class SpeckleDepthMaterial extends ExtendedMeshDepthMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexShader(): string {
    return speckleDepthVert
  }

  protected get fragmentShader(): string {
    return speckleDepthFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.depth.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      rteModelViewMatrix: new Matrix4(),
      near: 0,
      far: 0,
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1
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

  /** Another note here, this will NOT get called by three when rendering shadowmaps. We update the uniforms manually
   * inside SpeckleRenderer for shadowmaps
   */
  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleDepthMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleDepthMaterial.matBuff.elements[12] = 0
    SpeckleDepthMaterial.matBuff.elements[13] = 0
    SpeckleDepthMaterial.matBuff.elements[14] = 0
    object.modelViewMatrix.copy(SpeckleDepthMaterial.matBuff)

    SpeckleDepthMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleDepthMaterial.vecBuff0,
      SpeckleDepthMaterial.vecBuff1,
      SpeckleDepthMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleDepthMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleDepthMaterial.vecBuff2)
    this.userData.rteModelViewMatrix.value.copy(object.modelViewMatrix)

    if (object instanceof SpeckleMesh) {
      ;(object as SpeckleMesh).updateMaterialTransformsUniform(this)
    }

    this.needsUpdate = true
  }
}

export default SpeckleDepthMaterial
