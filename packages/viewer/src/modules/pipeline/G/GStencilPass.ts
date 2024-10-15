import {
  AlwaysStencilFunc,
  DoubleSide,
  Material,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  ReplaceStencilOp,
  Scene,
  Vector2,
  WebGLRenderer
} from 'three'
import { BaseGPass } from './GPass.js'
import SpeckleDisplaceMaterial from '../../materials/SpeckleDisplaceMaterial.js'

export class GStencilPass extends BaseGPass {
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

  public setClippingPlanes(planes: Plane[]) {
    this.stencilMaterial.clippingPlanes = planes
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    if (this.onBeforeRender) this.onBeforeRender()

    renderer.setRenderTarget(this.outputTarget)

    this.applyLayers(camera)

    renderer.clear(false, false, true)
    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()

    return false
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)

    this.stencilMaterial.userData.size.value.copy(new Vector2(width, height))
    this.stencilMaterial.needsUpdate = true
  }
}
