import {
  DoubleSide,
  EqualStencilFunc,
  Material,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  Vector2,
  WebGLRenderer
} from 'three'
import { BaseGPass } from './GPass.js'
import SpeckleDisplaceMaterial from '../../materials/SpeckleDisplaceMaterial.js'

export class GStencilMaskPass extends BaseGPass {
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

  public setClippingPlanes(planes: Plane[]) {
    this.stencilMaskMaterial.clippingPlanes = planes
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

    renderer.clear(false, true, false)
    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()

    return false
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)

    this.stencilMaskMaterial.userData.size.value.copy(new Vector2(width, height))
    this.stencilMaskMaterial.needsUpdate = true
  }
}
