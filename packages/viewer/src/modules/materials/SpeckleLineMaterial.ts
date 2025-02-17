/* eslint-disable camelcase */
import { speckleLineVert } from './shaders/speckle-line-vert.js'
import { speckleLineFrag } from './shaders/speckle-line-frag.js'
import {
  ShaderLib,
  Vector3,
  type IUniform,
  Material,
  Scene,
  Camera,
  BufferGeometry,
  Object3D
} from 'three'
import { ExtendedLineMaterial, type Uniforms } from './SpeckleMaterial.js'
import {
  LineMaterial,
  type LineMaterialParameters
} from 'three/examples/jsm/lines/LineMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleLineMaterial extends ExtendedLineMaterial {
  protected get vertexProgram(): string {
    return speckleLineVert
  }

  protected get fragmentProgram(): string {
    return speckleLineFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib['line'].uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      pixelThreshold: 0
    }
  }

  public set pixelThreshold(value: number) {
    this.userData.pixelThreshold.value = value
    this.needsUpdate = true
  }

  constructor(parameters: LineMaterialParameters, defines = ['USE_RTE']) {
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
    const toStandard = to as LineMaterial
    const fromStandard = from as LineMaterial
    toStandard.color.copy(fromStandard.color)
    to.userData.pixelThreshold.value = from.userData.pixelThreshold.value
  }

  onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
    _this.getDrawingBufferSize(this.resolution)
    this.needsUpdate = true
  }
}

export default SpeckleLineMaterial
