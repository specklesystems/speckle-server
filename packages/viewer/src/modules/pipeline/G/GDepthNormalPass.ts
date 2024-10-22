import {
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  RGBADepthPacking,
  Scene,
  Texture,
  WebGLMultipleRenderTargets,
  WebGLRenderer
} from 'three'
import { BaseGPass } from './GPass.js'
import SpeckleDepthMaterial from '../../materials/SpeckleDepthMaterial.js'
import { GPipeline } from './Pipelines/GPipeline.js'
import { DefaultDepthPassOptions, DepthPassOptions, DepthType } from './GDepthPass.js'

export interface DepthNormalPassOptions extends DepthPassOptions {}

export const DefaultDepthNormalPassOptions: Required<DepthNormalPassOptions> = {
  ...DefaultDepthPassOptions
}

export class GDepthNormalPass extends BaseGPass {
  private depthMaterial: SpeckleDepthMaterial
  private mrt: WebGLMultipleRenderTargets

  public _options: Required<DepthNormalPassOptions> = Object.assign(
    {},
    DefaultDepthNormalPassOptions
  )

  get displayName(): string {
    return 'DEPTH-NORMAL'
  }

  get overrideMaterial(): Material {
    return this.depthMaterial
  }

  get depthTexture(): Texture {
    return this.mrt.texture[0]
  }

  get normalTexture(): Texture {
    return this.mrt.texture[1]
  }

  public set options(value: DepthNormalPassOptions) {
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

  constructor() {
    super()

    this.mrt = GPipeline.createMultipleRenderTarget(2, {
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

  public setClippingPlanes(planes: Plane[]) {
    this.depthMaterial.clippingPlanes = planes
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    this.depthMaterial.userData.near.value = camera.near
    this.depthMaterial.userData.far.value = camera.far
    this.depthMaterial.needsUpdate = true
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
