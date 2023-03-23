/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardColoredVert } from './shaders/speckle-standard-colored-vert'
import { speckleStandardColoredFrag } from './shaders/speckle-standard-colored-frag'
import { UniformsUtils, Texture, NearestFilter } from 'three'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'

class SpeckleStandardColoredMaterial extends SpeckleStandardMaterial {
  protected get vertexShader(): string {
    return speckleStandardColoredVert
  }

  protected get fragmentShader(): string {
    return speckleStandardColoredFrag
  }

  constructor(parameters, defines = []) {
    super(parameters, defines)
  }

  protected defineUniforms() {
    super.defineUniforms()
    this.userData.gradientRamp = {
      value: null
    }
  }

  protected getAllUniforms() {
    return UniformsUtils.merge([
      super.defineUniforms(),
      {
        gradientRamp: {
          value: this.userData.gradientRamp.value
        }
      }
    ])
  }

  public onBeforeCompile(shader, renderer) {
    super.onBeforeCompile(shader, renderer)
    shader.uniforms.gradientRamp = this.userData.gradientRamp
  }

  copy(source) {
    super.copy(source)
    return this
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
