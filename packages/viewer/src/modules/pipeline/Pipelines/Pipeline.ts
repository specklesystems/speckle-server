import {
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Vector2,
  WebGLMultipleRenderTargets,
  WebGLRenderTarget,
  WebGLRenderTargetOptions
} from 'three'
import { GPass, ObjectVisibility } from '../Passes/GPass.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BatchUpdateRange } from '../../batching/Batch.js'

export abstract class Pipeline {
  protected speckleRenderer: SpeckleRenderer
  protected passList: Array<GPass> = []

  protected drawingSize: Vector2 = new Vector2()
  protected frameProjection: Matrix4 = new Matrix4()

  protected jitterIndex: number = 0
  protected jitterOffsets: number[][] = this.generateHaltonJiters(16)

  constructor(renderer: SpeckleRenderer) {
    this.speckleRenderer = renderer
  }

  public get passes(): Array<GPass> {
    return this.passList
  }

  public onBeforePipelineRender(): void {}
  public onAfterPipelineRender(): void {}

  public getPass(name: string): GPass[] {
    return this.passList.filter((pass: GPass) => {
      return pass.displayName === name
    })
  }

  public setClippingPlanes(planes: Plane[]): void {
    this.passList.forEach((pass: GPass) => pass.setClippingPlanes?.(planes))
  }

  public update(camera: PerspectiveCamera | OrthographicCamera): void {
    this.passList.forEach((pass: GPass) => pass.enabled && pass.update?.(camera))
  }

  public reset() {
    this.jitterIndex = 0
  }

  public render(): boolean {
    this.speckleRenderer.renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return false

    const camera = this.speckleRenderer.renderingCamera

    const restoreVisibility: Record<string, BatchUpdateRange> =
      this.speckleRenderer.batcher.saveVisiblity()
    const visibilityMap = {
      [ObjectVisibility.OPAQUE]: this.speckleRenderer.batcher.getOpaque(),
      [ObjectVisibility.TRANSPARENT]: this.speckleRenderer.batcher.getTransparent(),
      [ObjectVisibility.DEPTH]: this.speckleRenderer.batcher.getDepth(),
      [ObjectVisibility.STENCIL]: this.speckleRenderer.batcher.getStencil()
    }

    const [jitterX, jitterY] = this.jitterOffsets[this.jitterIndex]

    this.onBeforePipelineRender()

    this.speckleRenderer.renderer.setRenderTarget(null)
    this.speckleRenderer.renderer.setClearColor(0xffffff, 0)
    this.speckleRenderer.renderer.clear(true, true, true)

    let renderReturn: boolean = false
    let lastVisibility: ObjectVisibility
    this.passList.forEach((pass: GPass) => {
      if (!pass.enabled || !pass.render) return

      if (pass.visibility) {
        this.speckleRenderer.batcher.applyVisibility(visibilityMap[pass.visibility])
        lastVisibility = pass.visibility
      } else if (lastVisibility) {
        this.speckleRenderer.batcher.applyVisibility(restoreVisibility)
      }

      if (pass.overrideMaterial)
        this.speckleRenderer.batcher.overrideMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility,
          pass.overrideMaterial
        )

      if (pass.overrideBatchMaterial)
        this.speckleRenderer.batcher.overrideBatchMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility,
          pass.overrideBatchMaterial
        )

      if (pass.jitter && camera) {
        this.frameProjection.copy(camera.projectionMatrix)
        if (camera instanceof OrthographicCamera) {
          const pixelWidth = this.drawingSize.x
          const pixelHeight = this.drawingSize.y
          const width = camera.right - camera.left
          const height = camera.top - camera.bottom
          const pixelRatioW = pixelWidth / width
          const pixelRatioH = pixelHeight / height

          camera.setViewOffset(
            width,
            height,
            (jitterX / pixelRatioW) * 0.5,
            (jitterY / pixelRatioH) * 0.5,
            width,
            height
          )
        } else if (camera instanceof PerspectiveCamera) {
          camera.projectionMatrix.elements[8] = jitterX / this.drawingSize.x
          camera.projectionMatrix.elements[9] = jitterY / this.drawingSize.y
          /** Technically it should be this, but I'm not using it because I don't understand three's implementation */
          // camera.setViewOffset(
          //   this.drawingSize.x,
          //   this.drawingSize.y,
          //   jitterX * 0.5,
          //   jitterY * 0.5,
          //   this.drawingSize.x,
          //   this.drawingSize.y
          // )
        }
      }

      const ret = pass.render(
        this.speckleRenderer.renderer,
        this.speckleRenderer.renderingCamera,
        this.speckleRenderer.scene
      )
      renderReturn ||= ret

      if (pass.visibility)
        this.speckleRenderer.batcher.applyVisibility(restoreVisibility)
      if (pass.overrideMaterial)
        this.speckleRenderer.batcher.restoreMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility
        )
      if (pass.overrideBatchMaterial)
        this.speckleRenderer.batcher.restoreBatchMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility
        )
      if (pass.jitter && camera) camera.projectionMatrix.copy(this.frameProjection)
    })

    this.onAfterPipelineRender()

    this.jitterIndex = (this.jitterIndex + 1) % this.jitterOffsets.length

    return renderReturn
  }

  public resize(width: number, height: number) {
    this.passList.forEach((pass: GPass) => pass.setSize?.(width, height))
  }

  /**
   * Generate a number in the Halton Sequence at a given index. This is
   * shamelessly stolen from the pseudocode on the Wikipedia page
   *
   * @param base the base to use for the Halton Sequence
   * @param index the index into the sequence
   */
  protected haltonNumber(base: number, index: number) {
    let result = 0
    let f = 1
    while (index > 0) {
      f /= base
      result += f * (index % base)
      index = Math.floor(index / base)
    }

    return result
  }

  protected generateHaltonJiters(length: number) {
    const jitters = []

    for (let i = 1; i <= length; i++)
      jitters.push([
        (this.haltonNumber(2, i) - 0.5) * 2,
        (this.haltonNumber(3, i) - 0.5) * 2
      ])

    return jitters
  }

  public static createRenderTarget(
    options?: WebGLRenderTargetOptions,
    width?: number,
    height?: number
  ): WebGLRenderTarget {
    const renderTarget = new WebGLRenderTarget(width || 1, height || 1, options)
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    renderTarget.depthBuffer = true
    renderTarget.stencilBuffer = true

    return renderTarget
  }

  public static createMultipleRenderTarget(
    count: number,
    options?: WebGLRenderTargetOptions,
    width?: number,
    height?: number
  ): WebGLMultipleRenderTargets {
    const renderTarget = new WebGLMultipleRenderTargets(
      width || 1,
      height || 1,
      count,
      options
    )
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    ;(renderTarget as unknown as WebGLRenderTarget).depthBuffer = true
    ;(renderTarget as unknown as WebGLRenderTarget).stencilBuffer = true

    return renderTarget
  }
}
