/* eslint-disable camelcase */
import {
  BufferGeometry,
  Camera,
  Material,
  MeshMatcapMaterialParameters,
  Object3D,
  Scene,
  ShaderLib,
  Vector3,
  type IUniform
} from 'three'
import { Matrix4 } from 'three'
import { ExtendedMatcapMaterial, type Uniforms } from './SpeckleMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleMatcapMaterial extends ExtendedMatcapMaterial {
  protected get vertexProgram(): string {
    return ShaderLib.matcap.vertexShader
  }

  protected get fragmentProgram(): string {
    return ShaderLib.matcap.fragmentShader
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.matcap.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null
    }
  }

  constructor(parameters: MeshMatcapMaterialParameters, defines = []) {
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
    ;(to as SpeckleMatcapMaterial).matcap = (from as SpeckleMatcapMaterial).matcap
  }

  /** Called by three.js render loop */
  public onBeforeRender(
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

      this.needsUpdate = true
    }
  }
}

export default SpeckleMatcapMaterial
