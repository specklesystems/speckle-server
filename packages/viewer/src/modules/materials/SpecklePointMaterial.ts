/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { specklePointVert } from './shaders/speckle-point-vert'
import { specklePointFrag } from './shaders/speckle-point-frag'
import { IUniform, Material, Matrix4, PointsMaterial, ShaderLib, Vector3 } from 'three'
import { Geometry } from '../converter/Geometry'
import { ExtendedPointsMaterial, Uniforms } from './SpeckleMaterial'

class SpecklePointMaterial extends ExtendedPointsMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexProgram(): string {
    return specklePointVert
  }

  protected get fragmentProgram(): string {
    return specklePointFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.points.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3()
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

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as PointsMaterial
    const fromStandard = from as PointsMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.size = fromStandard.size
    toStandard.sizeAttenuation = fromStandard.sizeAttenuation
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpecklePointMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpecklePointMaterial.matBuff.elements[12] = 0
    SpecklePointMaterial.matBuff.elements[13] = 0
    SpecklePointMaterial.matBuff.elements[14] = 0
    // SpecklePointMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpecklePointMaterial.matBuff)

    SpecklePointMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpecklePointMaterial.vecBuff0,
      SpecklePointMaterial.vecBuff1,
      SpecklePointMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpecklePointMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpecklePointMaterial.vecBuff2)

    this.needsUpdate = true
  }
}

export default SpecklePointMaterial
