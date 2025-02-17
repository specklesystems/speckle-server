/* eslint-disable camelcase */
import { speckleDepthVert } from './shaders/speckle-depth-vert.js'
import { speckleDepthFrag } from './shaders/speckle-depth-frag.js'
import {
  BufferGeometry,
  Camera,
  Object3D,
  Scene,
  ShaderLib,
  Vector3,
  type IUniform,
  type MeshDepthMaterialParameters
} from 'three'
import { Matrix4, Material } from 'three'
import { ExtendedMeshDepthMaterial, type Uniforms } from './SpeckleMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleDepthMaterial extends ExtendedMeshDepthMaterial {
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

  constructor(parameters: MeshDepthMaterialParameters, defines: string[] = []) {
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
    to.userData.near.value = from.userData.near.value
    to.userData.far.value = from.userData.far.value
  }

  /** Another note here, this will NOT get called by three when rendering shadowmaps. We update the uniforms manually
   * inside SpeckleRenderer for shadowmaps
   */
  onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    if (this.defines && this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
      this.userData.rteModelViewMatrix.value.copy(_this.RTEBuffers.rteViewModelMatrix)
    }

    this.needsUpdate = true
  }
}

export default SpeckleDepthMaterial
