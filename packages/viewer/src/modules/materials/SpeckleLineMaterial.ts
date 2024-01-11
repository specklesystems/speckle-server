/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleLineVert } from './shaders/speckle-line-vert'
import { speckleLineFrag } from './shaders/speckle-line-frag'
import { ShaderLib, Vector3, IUniform, Material } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import { ExtendedLineMaterial, Uniforms } from './SpeckleMaterial'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

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

  constructor(parameters, defines = ['USE_RTE']) {
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
    const toStandard = to as LineMaterial
    const fromStandard = from as LineMaterial
    toStandard.color.copy(fromStandard.color)
    to.userData.pixelThreshold.value = from.userData.pixelThreshold.value
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
    _this.getDrawingBufferSize(this.resolution)
    this.needsUpdate = true
  }
}

export default SpeckleLineMaterial
