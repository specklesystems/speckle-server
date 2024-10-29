import { OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { BaseGPass } from './GPass.js'

export class GeometryPass extends BaseGPass {
  public get displayName(): string {
    return 'GEOMETRY'
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    if (this.onBeforeRender) this.onBeforeRender()

    this.applyLayers(camera)

    renderer.setRenderTarget(this.outputTarget)

    this.clear(renderer)

    renderer.render(scene, camera)
    if (this.onAfterRender) this.onAfterRender()

    return false
  }
}
