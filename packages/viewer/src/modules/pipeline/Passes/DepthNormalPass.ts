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
  WebGLRenderer,
  WebGLRenderTarget
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
  protected mrtMaterial: SpeckleDepthNormalMaterial
  protected mrt: WebGLMultipleRenderTargets

  public _options: Required<DepthNormalPassOptions> = Object.assign(
    {},
    DefaultDepthNormalPassOptions
  )

  get displayName(): string {
    return 'DEPTH-NORMAL'
  }

  get overrideMaterial(): Material {
    return this.mrtMaterial
  }

  get depthTexture(): Texture {
    return this.mrt.texture[0]
  }

  get normalTexture(): Texture {
    return this.mrt.texture[1]
  }

  get outputTarget(): WebGLRenderTarget | null {
    return this.mrt as unknown as WebGLRenderTarget
  }

  public set options(value: DepthNormalPassOptions) {
    super.options = value
    this.depthType = this._options.depthType
  }

  protected set depthType(value: DepthType) {
    if (value === DepthType.LINEAR_DEPTH)
      if (this.mrtMaterial.defines) {
        this.mrtMaterial.defines['LINEAR_DEPTH'] = ' '
      } else {
        if (this.mrtMaterial.defines) {
          delete this.mrtMaterial.defines['LINEAR_DEPTH']
        }
      }
    this.mrtMaterial.needsUpdate = true
  }

  constructor() {
    super()

    this.mrt = Pipeline.createMultipleRenderTarget(2, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.mrtMaterial = new SpeckleDepthNormalMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.mrtMaterial.blending = NoBlending
    this.mrtMaterial.side = DoubleSide
    this.depthType = this._options.depthType
  }

  public setClippingPlanes(planes: Plane[]) {
    this.mrtMaterial.clippingPlanes = planes
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    this.mrtMaterial.userData.near.value = camera.near
    this.mrtMaterial.userData.far.value = camera.far
    this.mrtMaterial.needsUpdate = true
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
