import { GeometryPass, SpeckleBasicMaterial } from '@speckle/viewer'
import {
  AlwaysStencilFunc,
  FrontSide,
  KeepStencilOp,
  NoBlending,
  ReplaceStencilOp
} from 'three'

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

    // Original
    // this.stencilFrontMaterial = new SpeckleBasicMaterial({ color: 0xff0000 }, [])
    // this.stencilFrontMaterial.side = FrontSide
    // this.stencilFrontMaterial.stencilWrite = true
    // this.stencilFrontMaterial.stencilFail = IncrementWrapStencilOp
    // this.stencilFrontMaterial.stencilZFail = IncrementWrapStencilOp
    // this.stencilFrontMaterial.stencilZPass = IncrementWrapStencilOp
    // this.stencilFrontMaterial.blending = NoBlending

    // Ours
    this.stencilFrontMaterial = new SpeckleBasicMaterial({ color: 0xff0000 }, [])
    this.stencilFrontMaterial.side = FrontSide
    this.stencilFrontMaterial.stencilWrite = true
    this.stencilFrontMaterial.stencilRef = 0
    this.stencilFrontMaterial.stencilFail = KeepStencilOp
    this.stencilFrontMaterial.stencilZFail = KeepStencilOp
    this.stencilFrontMaterial.stencilZPass = ReplaceStencilOp
    this.stencilFrontMaterial.stencilFunc = AlwaysStencilFunc
    this.stencilFrontMaterial.blending = NoBlending
    this.stencilFrontMaterial.polygonOffset = true
    this.stencilFrontMaterial.polygonOffsetFactor = 0.01
    this.stencilFrontMaterial.polygonOffsetUnits = 1
  }
}
