import {
  DoubleSide,
  FrontSide,
  Material,
  NoBlending,
  NormalBlending,
  Texture
} from 'three'
import { PassOptions } from './GPass.js'
import SpeckleViewportMaterial from '../../materials/SpeckleViewportMaterial.js'
import { Asset } from '../../../IViewer.js'
import { Assets } from '../../Assets.js'
import Logger from '../../utils/Logger.js'
import { GeometryPass } from './GeometryPass.js'

export interface ViewportPassOptions extends PassOptions {
  minIntensity?: number
  matcapTexture?: Asset | null
  opacity?: number
}

export const DefaultViewportPassOptions: Required<ViewportPassOptions> = {
  minIntensity: 0.1,
  matcapTexture: null,
  opacity: 1
}

export class ViewportPass extends GeometryPass {
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
    this.viewportMaterial.blending =
      this._options.opacity < 1 ? NormalBlending : NoBlending
    this.viewportMaterial.side = this._options.opacity < 1 ? FrontSide : DoubleSide
    this.viewportMaterial.transparent = this._options.opacity < 1 ? true : false
    this.viewportMaterial.toneMapped = false
    this.viewportMaterial.minIntensity = this._options.minIntensity
    this.viewportMaterial.opacity = this._options.opacity
    this.setMatcapTexture(this._options.matcapTexture)
  }

  constructor() {
    super()

    this.viewportMaterial = new SpeckleViewportMaterial({})
    this.options = DefaultViewportPassOptions
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
}
