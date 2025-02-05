import SpeckleBasicMaterial from './SpeckleBasicMaterial.js'
import { speckleViewportVert } from './shaders/speckle-viewport-vert.js'
import { speckleViewportFrag } from './shaders/speckle-viewport-frag.js'
import { Material, MeshBasicMaterialParameters, Texture } from 'three'
import { Uniforms } from './SpeckleMaterial.js'

class SpeckleViewportMaterial extends SpeckleBasicMaterial {
  protected get vertexProgram(): string {
    return speckleViewportVert
  }

  protected get fragmentProgram(): string {
    return speckleViewportFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, minIntensity: 0.01, tMatcap: null }
  }

  constructor(parameters: MeshBasicMaterialParameters, defines = ['USE_RTE']) {
    super(parameters, defines)
  }

  public set minIntensity(value: number) {
    this.userData.minIntensity.value = value
    this.needsUpdate = true
  }

  public set matcapTexture(value: Texture | null) {
    if (!this.defines) return

    if (value) {
      this.defines['MATCAP_TEXTURE'] = ''
      this.userData.tMatcap.value = value
    } else {
      delete this.defines['MATCAP_TEXTURE']
      this.userData.tMatcap.value = null
    }
    this.needsUpdate = true
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    ;(to as SpeckleViewportMaterial).userData.tMatcap.value = (
      from as SpeckleViewportMaterial
    ).userData.tMatcap.value
  }
}

export default SpeckleViewportMaterial
