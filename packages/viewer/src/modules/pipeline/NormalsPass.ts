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
  public jitter = true

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  private jitterIndex: number = 0
  private jitterOffsets: number[][] = this.generateHaltonJiters(16)

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

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    this.renderTarget.depthBuffer = true
    this.renderTarget.stencilBuffer = true
    // this.renderTarget.samples = 8

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
    if (this.jitter) {
      const [jitterX, jitterY] = this.jitterOffsets[this.jitterIndex]
      this.camera.projectionMatrix.elements[8] = jitterX / this.renderTarget.width
      this.camera.projectionMatrix.elements[9] = jitterY / this.renderTarget.height
      // ;(this.camera as PerspectiveCamera).updateProjectionMatrix()
      // ;(this.camera as PerspectiveCamera).setViewOffset(
      //   this.renderTarget.width,
      //   this.renderTarget.height,
      //   jitterX / 2,
      //   jitterY / 2,
      //   this.renderTarget.width,
      //   this.renderTarget.height
      // )
    }
    renderer.render(this.scene, this.camera)
    this.jitterIndex = (this.jitterIndex + 1) % this.jitterOffsets.length
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

  /**
   * Generate a number in the Halton Sequence at a given index. This is
   * shamelessly stolen from the pseudocode on the Wikipedia page
   *
   * @param base the base to use for the Halton Sequence
   * @param index the index into the sequence
   */
  haltonNumber(base: number, index: number) {
    let result = 0
    let f = 1
    while (index > 0) {
      f /= base
      result += f * (index % base)
      index = Math.floor(index / base)
    }

    return result
  }

  generateHaltonJiters(length: number) {
    const jitters = []

    for (let i = 1; i <= length; i++)
      jitters.push([
        (this.haltonNumber(2, i) - 0.5) * 2,
        (this.haltonNumber(3, i) - 0.5) * 2
      ])

    return jitters
  }
}
