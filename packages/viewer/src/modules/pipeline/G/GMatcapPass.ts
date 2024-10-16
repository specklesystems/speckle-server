import {
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  Texture,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { BaseGPass } from './GPass.js'
import SpeckleMatcapMaterial from '../../materials/SpeckleMatcapMaterial.js'
import { Assets } from '../../Assets.js'
import Logger from '../..//utils/Logger.js'
import defaultMatcap from '../../../assets/matcap.png'
import { AssetType } from '../../../IViewer.js'

export class GMatcapPass extends BaseGPass {
  private matcapMaterial: SpeckleMatcapMaterial

  get displayName(): string {
    return 'GEOMETRY-MATCAP'
  }

  get overrideMaterial(): Material {
    return this.matcapMaterial
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

    this.matcapMaterial = new SpeckleMatcapMaterial({})
    this.matcapMaterial.blending = NoBlending
    this.matcapMaterial.side = DoubleSide
    this.matcapMaterial.toneMapped = false
    Assets.getTexture({
      id: 'defaultMatcap',
      src: defaultMatcap,
      type: AssetType.TEXTURE_8BPP
    })
      .then((value: Texture) => {
        this.matcapMaterial.matcap = value
      })
      .catch((reason) => {
        Logger.error(`Matcap texture failed to load ${reason}`)
      })
  }

  public setClippingPlanes(planes: Plane[]) {
    this.matcapMaterial.clippingPlanes = planes
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
    // if (this.clear) {
    //   renderer.setClearColor(0x000000)
    //   renderer.setClearAlpha(0.0)
    //   renderer.clear()
    // }

    this.applyLayers(camera)

    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()
    return false
  }
}
