/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardColoredVert } from './shaders/speckle-standard-colored-vert'
import { speckleStandardColoredFrag } from './shaders/speckle-standard-colored-frag'
import { UniformsUtils, Texture, NearestFilter } from 'three'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'
import { Uniforms } from './SpeckleMaterial'

class SpeckleStandardColoredMaterial extends SpeckleStandardMaterial {
  protected get vertexShader(): string {
    return speckleStandardColoredVert
  }

  protected get fragmentShader(): string {
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

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleStandardMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleStandardMaterial.matBuff.elements[12] = 0
    SpeckleStandardMaterial.matBuff.elements[13] = 0
    SpeckleStandardMaterial.matBuff.elements[14] = 0
    object.modelViewMatrix.copy(SpeckleStandardMaterial.matBuff)

    SpeckleStandardMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleStandardMaterial.vecBuff0,
      SpeckleStandardMaterial.vecBuff1,
      SpeckleStandardMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleStandardMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleStandardMaterial.vecBuff2)

    if (object instanceof SpeckleMesh)
      (object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleStandardColoredMaterial
