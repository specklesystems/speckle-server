import {
  AlwaysStencilFunc,
  DoubleSide,
  Material,
  ReplaceStencilOp,
  Vector2
} from 'three'
import SpeckleDisplaceMaterial from '../../materials/SpeckleDisplaceMaterial.js'
import { GeometryPass } from './GeometryPass.js'

export class StencilPass extends GeometryPass {
  private stencilMaterial: SpeckleDisplaceMaterial

  public constructor() {
    super()
    this.stencilMaterial = new SpeckleDisplaceMaterial({ color: 0xff0000 }, ['USE_RTE'])
    this.stencilMaterial.userData.displacement.value = 2
    this.stencilMaterial.colorWrite = false
    this.stencilMaterial.depthWrite = false
    this.stencilMaterial.stencilWrite = true
    this.stencilMaterial.stencilFunc = AlwaysStencilFunc
    this.stencilMaterial.stencilWriteMask = 0xff
    this.stencilMaterial.stencilRef = 0xff
    this.stencilMaterial.stencilZFail = ReplaceStencilOp
    this.stencilMaterial.stencilZPass = ReplaceStencilOp
    this.stencilMaterial.stencilFail = ReplaceStencilOp
    this.stencilMaterial.side = DoubleSide
  }

  public get displayName(): string {
    return 'STENCIL'
  }

  public get overrideMaterial(): Material {
    return this.stencilMaterial
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)

    this.stencilMaterial.userData.size.value.copy(new Vector2(width, height))
    this.stencilMaterial.needsUpdate = true
  }
}
