/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleNormalVert } from './shaders/speckle-normal-vert'
import { speckleNormalFrag } from './shaders/speckle-normal-frag'
import { ShaderLib, Vector3, IUniform } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import { ExtendedMeshNormalMaterial, Uniforms } from './SpeckleMaterial'

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

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)

    this.needsUpdate = true
  }
}

export default SpeckleNormalMaterial
