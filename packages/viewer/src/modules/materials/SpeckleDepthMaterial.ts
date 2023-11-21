/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleDepthVert } from './shaders/speckle-depth-vert'
import { speckleDepthFrag } from './shaders/speckle-depth-frag'
import { ShaderLib, Vector3, IUniform } from 'three'
import { Matrix4, Material } from 'three'
import { ExtendedMeshDepthMaterial, Uniforms } from './SpeckleMaterial'

class SpeckleDepthMaterial extends ExtendedMeshDepthMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexProgram(): string {
    return speckleDepthVert
  }

  protected get fragmentProgram(): string {
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

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    to.userData.near.value = from.userData.near.value
    to.userData.far.value = from.userData.far.value
  }

  /** Another note here, this will NOT get called by three when rendering shadowmaps. We update the uniforms manually
   * inside SpeckleRenderer for shadowmaps
   */
  onBeforeRender(_this, scene, camera, geometry, object, group) {
    if (this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
      this.userData.rteModelViewMatrix.value.copy(_this.RTEBuffers.rteViewModelMatrix)
    }

    this.needsUpdate = true
  }
}

export default SpeckleDepthMaterial
