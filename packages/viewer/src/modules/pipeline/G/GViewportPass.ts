import {
  DoubleSide,
  Material,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  WebGLRenderer
} from 'three'
import { BaseGPass, PassOptions } from './GPass.js'
import SpeckleViewportMaterial from '../../materials/SpeckleViewportMaterial.js'

export interface ViewportPassOptions extends PassOptions {
  falloff?: number
}

export const DefaultViewportPassOptions: Required<ViewportPassOptions> = {
  falloff: 3
}

export class GViewportPass extends BaseGPass {
  protected viewportMaterial: SpeckleViewportMaterial

  public _options: Required<ViewportPassOptions> = Object.assign(
    {},
    DefaultViewportPassOptions
  )

  get displayName(): string {
    return 'GEOMETRY-VIEWPORT'
  }

  get overrideMaterial(): Material {
    return this.viewportMaterial
  }

  public set options(value: ViewportPassOptions) {
    super.options = value
    this.viewportMaterial.falloff = this._options.falloff
  }

  constructor() {
    super()

    this.viewportMaterial = new SpeckleViewportMaterial({})
    this.viewportMaterial.blending = NoBlending
    this.viewportMaterial.side = DoubleSide
    this.viewportMaterial.toneMapped = false
    this.viewportMaterial.falloff = this._options.falloff
  }

  public setClippingPlanes(planes: Plane[]) {
    this.viewportMaterial.clippingPlanes = planes
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
    this.clear(renderer)
    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()
    return false
  }
}
