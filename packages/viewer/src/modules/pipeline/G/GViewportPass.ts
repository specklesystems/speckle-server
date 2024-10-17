import {
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  WebGLRenderTarget,
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

    this._outputTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    this._outputTarget.depthBuffer = true
    this._outputTarget.stencilBuffer = true

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
