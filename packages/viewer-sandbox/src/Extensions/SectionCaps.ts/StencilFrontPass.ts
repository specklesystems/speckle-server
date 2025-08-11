import { GeometryPass, SpeckleBasicMaterial } from '@speckle/viewer'
import { FrontSide, IncrementWrapStencilOp, NoBlending } from 'three'

export class StencilFrontPass extends GeometryPass {
  private stencilFrontMaterial: SpeckleBasicMaterial

  get displayName(): string {
    return 'STENCIL-FRONT'
  }

  get overrideMaterial(): SpeckleBasicMaterial {
    return this.stencilFrontMaterial
  }
  constructor() {
    super()

    this.stencilFrontMaterial = new SpeckleBasicMaterial({ color: 0xff0000 }, [])
    this.stencilFrontMaterial.side = FrontSide
    this.stencilFrontMaterial.stencilWrite = true
    this.stencilFrontMaterial.stencilFail = IncrementWrapStencilOp
    this.stencilFrontMaterial.stencilZFail = IncrementWrapStencilOp
    this.stencilFrontMaterial.stencilZPass = IncrementWrapStencilOp
    this.stencilFrontMaterial.blending = NoBlending
  }
}
