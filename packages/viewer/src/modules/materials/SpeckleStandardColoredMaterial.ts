import { speckleStandardColoredVert } from './shaders/speckle-standard-colored-vert'
import { speckleStandardColoredFrag } from './shaders/speckle-standard-colored-frag'
import { Texture, NearestFilter } from 'three'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'
import { Uniforms } from './SpeckleMaterial'

class SpeckleStandardColoredMaterial extends SpeckleStandardMaterial {
  protected get vertexProgram(): string {
    return speckleStandardColoredVert
  }

  protected get fragmentProgram(): string {
    return speckleStandardColoredFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, gradientRamp: null }
  }

  constructor(parameters, defines = []) {
    super(parameters, defines)
  }

  public setGradientTexture(texture: Texture) {
    this.userData.gradientRamp.value = texture
    this.userData.gradientRamp.value.generateMipmaps = false
    this.userData.gradientRamp.value.minFilter = NearestFilter
    this.userData.gradientRamp.value.magFilter = NearestFilter
    this.needsUpdate = true
  }
}

export default SpeckleStandardColoredMaterial
