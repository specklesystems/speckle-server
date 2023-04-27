import {
  Camera,
  Color,
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  RGBADepthPacking,
  Scene,
  Side,
  Texture,
  WebGLRenderTarget
} from 'three'
import SpeckleDepthMaterial from '../materials/SpeckleDepthMaterial'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export enum DepthType {
  PERSPECTIVE_DEPTH,
  LINEAR_DEPTH
}

export enum DepthSize {
  FULL,
  HALF
}

export class DepthPass extends BaseSpecklePass implements SpecklePass {
  private renderTarget: WebGLRenderTarget
  private renderTargetHalf: WebGLRenderTarget
  private depthMaterial: SpeckleDepthMaterial = null
  private depthBufferSize: DepthSize = DepthSize.FULL
  private scene: Scene
  private camera: Camera

  private colorBuffer: Color = new Color()

  public onBeforeRender: () => void = null
  public onAfterRender: () => void = null

  get displayName(): string {
    return 'DEPTH'
  }

  get material(): Material {
    return this.depthMaterial
  }

  get outputTexture(): Texture {
    return this.renderTarget.texture
  }

  get outputTextureHalf(): Texture {
    return this.renderTargetHalf.texture
  }

  public set depthType(value: DepthType) {
    if (value === DepthType.LINEAR_DEPTH)
      this.depthMaterial.defines['LINEAR_DEPTH'] = ' '
    else delete this.depthMaterial.defines['LINEAR_DEPTH']
    this.depthMaterial.needsUpdate = true
  }

  public set depthSize(value: DepthSize) {
    this.depthBufferSize = value
  }

  public set depthSide(value: Side) {
    this.depthMaterial.side = value
  }

  constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    this.renderTargetHalf = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    this.renderTarget.depthBuffer = true
    this.renderTarget.stencilBuffer = true
    this.renderTargetHalf.depthBuffer = true
    this.renderTargetHalf.stencilBuffer = true

    this.depthMaterial = new SpeckleDepthMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )

    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide
  }

  public setClippingPlanes(planes: Plane[]) {
    this.depthMaterial.clippingPlanes = planes
  }

  public update(scene: Scene, camera: Camera) {
    this.camera = camera
    this.scene = scene
    this.depthMaterial.userData.near.value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.depthMaterial.userData.far.value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.depthMaterial.needsUpdate = true
  }

  public render(renderer, writeBuffer, readBuffer) {
    writeBuffer
    readBuffer

    this.onBeforeRender()
    renderer.getClearColor(this.colorBuffer)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    renderer.setRenderTarget(
      this.depthBufferSize === DepthSize.FULL
        ? this.renderTarget
        : this.renderTargetHalf
    )
    renderer.autoClear = false

    renderer.setClearColor(0x000000)
    renderer.setClearAlpha(1.0)
    renderer.clear()

    const shadowmapEnabled = renderer.shadowMap.enabled
    const shadowmapNeedsUpdate = renderer.shadowMap.needsUpdate
    // this.scene.overrideMaterial = this.depthMaterial
    renderer.shadowMap.enabled = false
    renderer.shadowMap.needsUpdate = false
    this.applyLayers(this.camera)
    renderer.render(this.scene, this.camera)
    renderer.shadowMap.enabled = shadowmapEnabled
    renderer.shadowMap.needsUpdate = shadowmapNeedsUpdate
    this.scene.overrideMaterial = null

    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(this.colorBuffer)
    renderer.setClearAlpha(originalClearAlpha)
    this.onAfterRender()
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
    this.renderTargetHalf.setSize(width * 0.5, height * 0.5)
  }
}
