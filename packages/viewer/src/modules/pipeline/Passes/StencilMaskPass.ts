import { DoubleSide, EqualStencilFunc, Material, Vector2 } from 'three'
import SpeckleDisplaceMaterial from '../../materials/SpeckleDisplaceMaterial.js'
import { GeometryPass } from './GeometryPass.js'

export class StencilMaskPass extends GeometryPass {
  private stencilMaskMaterial: SpeckleDisplaceMaterial

  public constructor() {
    super()
    this.stencilMaskMaterial = new SpeckleDisplaceMaterial({ color: 0x04a5fb }, [
      'USE_RTE'
    ])
    this.stencilMaskMaterial.userData.displacement.value = 2
    this.stencilMaskMaterial.colorWrite = true
    this.stencilMaskMaterial.depthWrite = false
    this.stencilMaskMaterial.stencilWrite = true
    this.stencilMaskMaterial.stencilFunc = EqualStencilFunc
    this.stencilMaskMaterial.stencilRef = 0xff
    this.stencilMaskMaterial.side = DoubleSide
  }
  public get displayName(): string {
    return 'STENCIL-MASK'
  }

  public get overrideMaterial(): Material {
    return this.stencilMaskMaterial
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)

    this.stencilMaskMaterial.userData.size.value.copy(new Vector2(width, height))
    this.stencilMaskMaterial.needsUpdate = true
  }
}
