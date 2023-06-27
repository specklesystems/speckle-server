/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleNormalVert } from './shaders/speckle-normal-vert'
import { speckleNormalFrag } from './shaders/speckle-normal-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshNormalMaterial, IUniform } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedMeshNormalMaterial, Uniforms } from './SpeckleMaterial'

class SpeckleNormalMaterial extends ExtendedMeshNormalMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexShader(): string {
    return speckleNormalVert
  }

  protected get fragmentShader(): string {
    return speckleNormalFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.normal.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null
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

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleNormalMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleNormalMaterial.matBuff.elements[12] = 0
    SpeckleNormalMaterial.matBuff.elements[13] = 0
    SpeckleNormalMaterial.matBuff.elements[14] = 0
    object.modelViewMatrix.copy(SpeckleNormalMaterial.matBuff)

    SpeckleNormalMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleNormalMaterial.vecBuff0,
      SpeckleNormalMaterial.vecBuff1,
      SpeckleNormalMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleNormalMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleNormalMaterial.vecBuff2)

    if (object instanceof SpeckleMesh)
      (object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleNormalMaterial
