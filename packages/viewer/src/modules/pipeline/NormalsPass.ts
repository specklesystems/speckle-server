import {
  Camera,
  Color,
  DoubleSide,
  Material,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  Texture,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import SpeckleNormalMaterial from '../materials/SpeckleNormalMaterial.js'
import { BaseSpecklePass, type SpecklePass } from './SpecklePass.js'

export class NormalsPass extends BaseSpecklePass implements SpecklePass {
  private renderTarget: WebGLRenderTarget
  private normalsMaterial: SpeckleNormalMaterial
  private scene: Scene
  private camera: Camera

  private colorBuffer: Color = new Color()

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  get displayName(): string {
    return 'GEOMETRY-NORMALS'
  }

  get outputTexture(): Texture {
    return this.renderTarget.texture
  }

  get material(): Material {
    return this.normalsMaterial
  }

  constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256)
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    this.renderTarget.depthBuffer = true
    this.renderTarget.stencilBuffer = true

    this.normalsMaterial = new SpeckleNormalMaterial({}, ['USE_RTE'])
    this.normalsMaterial.blending = NoBlending
    this.normalsMaterial.side = DoubleSide
  }

  public setClippingPlanes(planes: Plane[]) {
    this.normalsMaterial.clippingPlanes = planes
  }

  public update(scene: Scene, camera: PerspectiveCamera | OrthographicCamera) {
    this.camera = camera
    this.scene = scene
  }

  public render(renderer: WebGLRenderer) {
    if (this.onBeforeRender) this.onBeforeRender()
    renderer.getClearColor(this.colorBuffer)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    renderer.setRenderTarget(this.renderTarget)
    renderer.autoClear = false

    renderer.setClearColor(0x000000)
    renderer.setClearAlpha(1.0)
    renderer.clear()

    const shadowmapEnabled = renderer.shadowMap.enabled
    const shadowmapNeedsUpdate = renderer.shadowMap.needsUpdate
    // this.scene.overrideMaterial = this.normalsMaterial
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
    if (this.onAfterRender) this.onAfterRender()
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
  }
}
