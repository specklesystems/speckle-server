import {
  Camera,
  Color,
  DoubleSide,
  NoBlending,
  RGBADepthPacking,
  Scene,
  Texture,
  WebGLRenderTarget
} from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass'
import SpeckleDepthMaterial from '../materials/SpeckleDepthMaterial'
import { SpecklePass } from './Pipeline'

export class DepthPass extends Pass implements SpecklePass {
  private renderTarget: WebGLRenderTarget
  private depthMaterial: SpeckleDepthMaterial = null
  private scene: Scene
  private camera: Camera

  private colorBuffer: Color = new Color()

  get displayName(): string {
    return 'DEPTH'
  }

  get outputTexture(): Texture {
    return this.renderTarget.texture
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

    this.depthMaterial = new SpeckleDepthMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide
  }

  public update(camera: Camera, scene: Scene) {
    this.camera = camera
    this.scene = scene
  }

  public render(renderer, writeBuffer, readBuffer) {
    writeBuffer
    readBuffer

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
    this.scene.overrideMaterial = this.depthMaterial
    renderer.shadowMap.enabled = false
    renderer.shadowMap.needsUpdate = false
    renderer.render(this.scene, this.camera)
    renderer.shadowMap.enabled = shadowmapEnabled
    renderer.shadowMap.needsUpdate = shadowmapNeedsUpdate
    this.scene.overrideMaterial = null

    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(this.colorBuffer)
    renderer.setClearAlpha(originalClearAlpha)
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
  }
}
