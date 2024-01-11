/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { specklePointVert } from './shaders/speckle-point-vert'
import { specklePointFrag } from './shaders/speckle-point-frag'
import { IUniform, Material, Matrix4, PointsMaterial, ShaderLib, Vector3 } from 'three'
import { Geometry } from '../converter/Geometry'
import { ExtendedPointsMaterial, Uniforms } from './SpeckleMaterial'

class SpecklePointMaterial extends ExtendedPointsMaterial {
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
    const toStandard = to as PointsMaterial
    const fromStandard = from as PointsMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.size = fromStandard.size
    toStandard.sizeAttenuation = fromStandard.sizeAttenuation
  }

  onBeforeRender(_this, scene, camera, geometry, object, group) {
    object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)

    this.needsUpdate = true
  }
}

export default SpecklePointMaterial
