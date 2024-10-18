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
import SpeckleMatcapMaterial from '../../materials/SpeckleMatcapMaterial.js'
import { Assets } from '../../Assets.js'
import Logger from '../..//utils/Logger.js'
import defaultMatcap from '../../../assets/matcap.png'
import { Asset, AssetType } from '../../../IViewer.js'

export interface MatcapPassOptions extends PassOptions {
  matcapTexture?: Asset | null
}

export const DefaultMatcapPassOptions: Required<MatcapPassOptions> = {
  matcapTexture: {
    id: 'defaultMatcap',
    src: defaultMatcap,
    type: AssetType.TEXTURE_8BPP
  }
}

export class GMatcapPass extends BaseGPass {
  private matcapMaterial: SpeckleMatcapMaterial

  public _options: Required<MatcapPassOptions> = Object.assign(
    {},
    DefaultMatcapPassOptions
  )

  get displayName(): string {
    return 'GEOMETRY-MATCAP'
  }

  get overrideMaterial(): Material {
    return this.matcapMaterial
  }

  public set options(value: MatcapPassOptions) {
    super.options = value
    this.setMatcapTexture(this._options.matcapTexture)
  }

  constructor() {
    super()

    this.matcapMaterial = new SpeckleMatcapMaterial({})
    this.matcapMaterial.blending = NoBlending
    this.matcapMaterial.side = DoubleSide
    this.matcapMaterial.toneMapped = false

    this.setMatcapTexture(this._options.matcapTexture)
  }

  protected setMatcapTexture(asset: Asset | null) {
    if (!asset) return

    Assets.getTexture(asset)
      .then((value: Texture) => {
        this.matcapMaterial.matcap = value
        this.matcapMaterial.needsUpdate = true
        this.matcapMaterial.needsCopy = true
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
