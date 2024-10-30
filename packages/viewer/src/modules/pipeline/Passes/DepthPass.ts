import {
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  RGBADepthPacking,
  Side
} from 'three'
import { PassOptions } from './GPass.js'
import SpeckleDepthMaterial from '../../materials/SpeckleDepthMaterial.js'
import { Pipeline } from '../Pipelines/Pipeline.js'
import { GeometryPass } from './GeometryPass.js'

export enum DepthType {
  PERSPECTIVE_DEPTH,
  LINEAR_DEPTH
}

export interface DepthPassOptions extends PassOptions {
  depthType?: DepthType
}

export const DefaultDepthPassOptions: Required<DepthPassOptions> = {
  depthType: DepthType.LINEAR_DEPTH
}

export class DepthPass extends GeometryPass {
  private depthMaterial: SpeckleDepthMaterial

  public _options: Required<DepthPassOptions> = Object.assign(
    {},
    DefaultDepthPassOptions
  )

  get displayName(): string {
    return 'DEPTH'
  }

  get overrideMaterial(): Material {
    return this.depthMaterial
  }

  public set options(value: DepthPassOptions) {
    super.options = value
    this.depthType = this._options.depthType
  }

  protected set depthType(value: DepthType) {
    if (value === DepthType.LINEAR_DEPTH)
      if (this.depthMaterial.defines) {
        this.depthMaterial.defines['LINEAR_DEPTH'] = ' '
      } else {
        if (this.depthMaterial.defines) {
          delete this.depthMaterial.defines['LINEAR_DEPTH']
        }
      }
    this.depthMaterial.needsUpdate = true
  }

  public set depthSide(value: Side) {
    this.depthMaterial.side = value
  }

  constructor() {
    super()

    this._outputTarget = Pipeline.createRenderTarget({
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.depthMaterial = new SpeckleDepthMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide
    this.depthType = this._options.depthType
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    this.depthMaterial.userData.near.value = camera.near
    this.depthMaterial.userData.far.value = camera.far
    this.depthMaterial.needsUpdate = true
  }
}
