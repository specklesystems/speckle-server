import { OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { BaseGPass } from './GPass.js'

export class GColorPass extends BaseGPass {
  public constructor() {
    super()
  }

  public get displayName(): string {
    return 'COLOR'
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    this.applyLayers(camera)

    renderer.setRenderTarget(this.outputTarget)

    if (this.onBeforeRender) this.onBeforeRender()
    renderer.render(scene, camera)
    if (this.onAfterRender) this.onAfterRender()

    return false
  }
}
