/* eslint-disable camelcase */
import { specklePointVert } from './shaders/speckle-point-vert'
import { specklePointFrag } from './shaders/speckle-point-frag'
import { Material, NearestFilter, Texture, type PointsMaterialParameters } from 'three'
import type { Uniforms } from './SpeckleMaterial'
import SpecklePointMaterial from './SpecklePointMaterial'

class SpecklePointColouredMaterial extends SpecklePointMaterial {
  protected get vertexProgram(): string {
    return specklePointVert
  }

  protected get fragmentProgram(): string {
    return specklePointFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, gradientRamp: null }
  }

  constructor(
    parameters: PointsMaterialParameters,
    defines: string[] = ['USE_RTE', 'USE_GRADIENT_RAMP']
  ) {
    super(parameters, defines)
  }

  public setGradientTexture(texture: Texture) {
    this.userData.gradientRamp.value = texture
    this.userData.gradientRamp.value.generateMipmaps = false
    this.userData.gradientRamp.value.minFilter = NearestFilter
    this.userData.gradientRamp.value.magFilter = NearestFilter
    this.needsUpdate = true
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    to.userData.gradientRamp.value = from.userData.gradientRamp.value
  }
}

export default SpecklePointColouredMaterial
