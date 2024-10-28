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
import { Pipeline } from '../Pipelines/Pipeline.js'
import { DefaultDepthPassOptions, DepthPassOptions, DepthType } from './DepthPass.js'
import SpeckleDepthNormalMaterial from '../../materials/SpeckleDepthNormalMaterial.js'

export interface DepthNormalPassOptions extends DepthPassOptions {}

export const DefaultDepthNormalPassOptions: Required<DepthNormalPassOptions> = {
  ...DefaultDepthPassOptions
}

export class DepthNormalPass extends BaseGPass {
  private depthNormalMaterial: SpeckleDepthNormalMaterial
  private mrt: WebGLMultipleRenderTargets

  public _options: Required<DepthNormalPassOptions> = Object.assign(
    {},
    DefaultDepthNormalPassOptions
  )

  get displayName(): string {
    return 'DEPTH-NORMAL'
  }

  get overrideMaterial(): Material {
    return this.depthNormalMaterial
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
      if (this.depthNormalMaterial.defines) {
        this.depthNormalMaterial.defines['LINEAR_DEPTH'] = ' '
      } else {
        if (this.depthNormalMaterial.defines) {
          delete this.depthNormalMaterial.defines['LINEAR_DEPTH']
        }
      }
    this.depthNormalMaterial.needsUpdate = true
  }

  constructor() {
    super()

    this.mrt = Pipeline.createMultipleRenderTarget(2, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.depthNormalMaterial = new SpeckleDepthNormalMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.depthNormalMaterial.blending = NoBlending
    this.depthNormalMaterial.side = DoubleSide
    this.depthType = this._options.depthType
  }

  public setClippingPlanes(planes: Plane[]) {
    this.depthNormalMaterial.clippingPlanes = planes
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    this.depthNormalMaterial.userData.near.value = camera.near
    this.depthNormalMaterial.userData.far.value = camera.far
    this.depthNormalMaterial.needsUpdate = true
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    if (this.onBeforeRender) this.onBeforeRender()

    renderer.setRenderTarget(this.mrt)

    this.applyLayers(camera)

    this.clear(renderer)

    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()

    return false
  }

  public setSize(width: number, height: number): void {
    this.mrt.setSize(width, height)
  }
}
