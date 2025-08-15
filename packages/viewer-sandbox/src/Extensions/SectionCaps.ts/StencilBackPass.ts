import { GeometryPass, SpeckleBasicMaterial } from '@speckle/viewer'
import {
  AlwaysStencilFunc,
  BackSide,
  KeepStencilOp,
  NoBlending,
  ReplaceStencilOp
} from 'three'

export class StencilBackPass extends GeometryPass {
  private stencilBackMaterial: SpeckleBasicMaterial

  get displayName(): string {
    return 'STENCIL-BACK'
  }

  get overrideMaterial(): SpeckleBasicMaterial {
    return this.stencilBackMaterial
  }
  constructor() {
    super()

    // ORIGINAL
    // this.stencilBackMaterial = new SpeckleBasicMaterial({ color: 0x0000ff }, [])
    // // this.stencilBackMaterial.colorWrite = false
    // this.stencilBackMaterial.depthWrite = false
    // this.stencilBackMaterial.side = BackSide
    // this.stencilBackMaterial.stencilWrite = true
    // this.stencilBackMaterial.stencilFail = DecrementWrapStencilOp
    // this.stencilBackMaterial.stencilZFail = DecrementWrapStencilOp
    // this.stencilBackMaterial.stencilZPass = DecrementWrapStencilOp
    // this.stencilBackMaterial.blending = NoBlending

    // OURS
    this.stencilBackMaterial = new SpeckleBasicMaterial({ color: 0x0000ff }, [])
    // this.stencilBackMaterial.colorWrite = false
    // this.stencilBackMaterial.depthWrite = false
    this.stencilBackMaterial.side = BackSide
    this.stencilBackMaterial.stencilWrite = true
    this.stencilBackMaterial.stencilRef = 1
    this.stencilBackMaterial.stencilFail = KeepStencilOp
    this.stencilBackMaterial.stencilZFail = KeepStencilOp
    this.stencilBackMaterial.stencilZPass = ReplaceStencilOp
    this.stencilBackMaterial.stencilFunc = AlwaysStencilFunc
    this.stencilBackMaterial.blending = NoBlending
  }
}
