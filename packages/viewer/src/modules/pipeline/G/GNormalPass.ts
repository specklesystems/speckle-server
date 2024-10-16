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
import SpeckleNormalMaterial from '../../materials/SpeckleNormalMaterial.js'
import { BaseGPass } from './GPass.js'

export class GNormalsPass extends BaseGPass {
  private normalsMaterial: SpeckleNormalMaterial

  get displayName(): string {
    return 'GEOMETRY-NORMALS'
  }

  get overrideMaterial(): Material {
    return this.normalsMaterial
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

    this.normalsMaterial = new SpeckleNormalMaterial({}, ['USE_RTE'])
    this.normalsMaterial.blending = NoBlending
    this.normalsMaterial.side = DoubleSide
  }

  public setClippingPlanes(planes: Plane[]) {
    this.normalsMaterial.clippingPlanes = planes
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    if (this.onBeforeRender) this.onBeforeRender()

    renderer.setRenderTarget(this.outputTarget)

    this.clear(renderer)
    // renderer.setClearColor(0x000000)
    // renderer.setClearAlpha(1.0)
    // renderer.clear()

    this.applyLayers(camera)

    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()
    return false
  }
}
