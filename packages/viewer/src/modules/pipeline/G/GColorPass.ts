import {
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { BaseGPass } from './GPass.js'

export class GColorPass extends BaseGPass {
  public constructor() {
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

    if (this.onBeforeRender) this.onBeforeRender()

    this.applyLayers(camera)

    renderer.setRenderTarget(this.outputTarget)

    this.clear(renderer)

    renderer.render(scene, camera)
    if (this.onAfterRender) this.onAfterRender()

    return false
  }
}
