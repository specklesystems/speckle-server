/* eslint-disable camelcase */
import { speckleNormalVert } from './shaders/speckle-normal-vert.js'
import { speckleNormalFrag } from './shaders/speckle-normal-frag.js'
import {
  BufferGeometry,
  Camera,
  Material,
  Object3D,
  Scene,
  ShaderLib,
  Vector3,
  type IUniform,
  type MeshNormalMaterialParameters
} from 'three'
import { Matrix4 } from 'three'
import { ExtendedMeshNormalMaterial, type Uniforms } from './SpeckleMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleNormalMaterial extends ExtendedMeshNormalMaterial {
  protected get vertexProgram(): string {
    return speckleNormalVert
  }

  protected get fragmentProgram(): string {
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

  constructor(parameters: MeshNormalMaterialParameters, defines = ['USE_RTE']) {
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

export default SpeckleNormalMaterial
