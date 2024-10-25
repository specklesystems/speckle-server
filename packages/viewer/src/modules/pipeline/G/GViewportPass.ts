import {
  DoubleSide,
  Material,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  Texture,
  WebGLRenderer
} from 'three'
import { BaseGPass, PassOptions } from './GPass.js'
import SpeckleViewportMaterial from '../../materials/SpeckleViewportMaterial.js'
import { Asset } from '../../../IViewer.js'
import { Assets } from '../../Assets.js'
import Logger from '../../utils/Logger.js'

export interface ViewportPassOptions extends PassOptions {
  minIntensity?: number
  matcapTexture?: Asset | null
}

export const DefaultViewportPassOptions: Required<ViewportPassOptions> = {
  minIntensity: 0.1,
  matcapTexture: null
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

  // get overrideMaterial(): Material {
  //   return this.viewportMaterial
  // }

  get overrideBatchMaterial(): Material {
    return this.viewportMaterial
  }

  public set options(value: ViewportPassOptions) {
    super.options = value
    this.viewportMaterial.minIntensity = this._options.minIntensity
    this.setMatcapTexture(this._options.matcapTexture)
  }

  constructor() {
    super()

    this.viewportMaterial = new SpeckleViewportMaterial({})
    this.viewportMaterial.blending = NoBlending
    this.viewportMaterial.side = DoubleSide
    this.viewportMaterial.toneMapped = false
    this.viewportMaterial.minIntensity = this._options.minIntensity
    this.setMatcapTexture(this._options.matcapTexture)
  }

  public setClippingPlanes(planes: Plane[]) {
    this.viewportMaterial.clippingPlanes = planes
  }

  protected setMatcapTexture(asset: Asset | null) {
    if (!asset) return

    Assets.getTexture(asset)
      .then((value: Texture) => {
        this.viewportMaterial.matcapTexture = value
        this.viewportMaterial.needsCopy = true
      })
      .catch((reason) => {
        Logger.error(`Matcap texture failed to load ${reason}`)
      })
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
