import { DoubleSide, NearestFilter, NoBlending, RGBADepthPacking, Texture } from 'three'
import { Pipeline } from '../Pipelines/Pipeline.js'
import {
  DefaultDepthNormalPassOptions,
  DepthNormalPass,
  DepthNormalPassOptions
} from './DepthNormalPass.js'
import SpeckleDepthNormalIdMaterial from '../../materials/SpeckleDepthNormalIdMaterial.js'

export interface DepthNormalIdPassOptions extends DepthNormalPassOptions {}

export const DefaultDepthNormalIdPassOptions: Required<DepthNormalIdPassOptions> = {
  ...DefaultDepthNormalPassOptions
}

export class DepthNormalIdPass extends DepthNormalPass {
  public _options: Required<DepthNormalPassOptions> = Object.assign(
    {},
    DefaultDepthNormalIdPassOptions
  )

  get displayName(): string {
    return 'DEPTH-NORMAL-ID'
  }

  get idTexture(): Texture {
    return this.mrt.texture[2]
  }

  public set options(value: DepthNormalIdPassOptions) {
    super.options = value
  }

  constructor() {
    super()

    this.mrt = Pipeline.createMultipleRenderTarget(3, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.mrtMaterial = new SpeckleDepthNormalIdMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.mrtMaterial.blending = NoBlending
    this.mrtMaterial.side = DoubleSide
    this.depthType = this._options.depthType
  }
}
