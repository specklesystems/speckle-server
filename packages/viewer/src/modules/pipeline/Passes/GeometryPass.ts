import {
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  WebGLRenderer
} from 'three'
import { BaseGPass } from './GPass.js'

export class GeometryPass extends BaseGPass {
  public get displayName(): string {
    return 'GEOMETRY'
  }

  public setClippingPlanes(planes: Plane[]) {
    if (this.overrideMaterial) this.overrideMaterial.clippingPlanes = planes
    if (this.overrideBatchMaterial) this.overrideBatchMaterial.clippingPlanes = planes
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
