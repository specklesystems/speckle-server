import { OrthographicCamera, PerspectiveCamera, Plane, Vector2 } from 'three'
import { GPass, ObjectVisibility } from './GPass.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BatchUpdateRange } from '../../batching/Batch.js'

export abstract class GPipeline {
  protected speckleRenderer: SpeckleRenderer
  protected passList: Array<GPass> = []

  private drawingSize: Vector2 = new Vector2()

  constructor(renderer: SpeckleRenderer) {
    this.speckleRenderer = renderer
  }

  public onBeforePipelineRender(): void {}
  public onAfterPipelineRender(): void {}

  public addPass(pass: GPass) {
    this.passList.push(pass)
  }

  public setClippingPlanes(planes: Plane[]): void {
    this.passList.forEach((pass: GPass) => pass.setClippingPlanes?.(planes))
  }

  public update(camera: PerspectiveCamera | OrthographicCamera): void {
    this.passList.forEach((pass: GPass) => pass.enabled && pass.update?.(camera))
  }

  public render(): boolean {
    this.speckleRenderer.renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return false

    const restoreVisibility: Record<string, BatchUpdateRange> =
      this.speckleRenderer.batcher.saveVisiblity()
    const visibilityMap = {
      [ObjectVisibility.OPAQUE]: this.speckleRenderer.batcher.getOpaque(),
      [ObjectVisibility.TRANSPARENT]: this.speckleRenderer.batcher.getTransparent(),
      [ObjectVisibility.DEPTH]: this.speckleRenderer.batcher.getDepth(),
      [ObjectVisibility.STENCIL]: this.speckleRenderer.batcher.getStencil()
    }

    this.onBeforePipelineRender()

    this.speckleRenderer.renderer.setRenderTarget(null)
    this.speckleRenderer.renderer.setClearColor(0xffffff)
    this.speckleRenderer.renderer.setClearAlpha(0)
    this.speckleRenderer.renderer.clear(true, true, true)

    this.passList.forEach((pass: GPass) => {
      if (!pass.enabled) return
      if (pass.visibility)
        this.speckleRenderer.batcher.applyVisibility(visibilityMap[pass.visibility])
      if (pass.overrideMaterial)
        this.speckleRenderer.batcher.overrideMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility,
          pass.overrideMaterial
        )

      pass.render?.(
        this.speckleRenderer.renderer,
        this.speckleRenderer.renderingCamera,
        this.speckleRenderer.scene
      )
      if (pass.visibility)
        this.speckleRenderer.batcher.applyVisibility(restoreVisibility)
      if (pass.overrideMaterial)
        this.speckleRenderer.batcher.restoreMaterial(
          pass.visibility ? visibilityMap[pass.visibility] : restoreVisibility
        )
    })

    this.onAfterPipelineRender()

    return true
  }

  public resize(width: number, height: number) {
    this.passList.forEach((pass: GPass) => pass.setSize?.(width, height))
  }

  public onStationaryBegin() {}

  public onStationaryEnd() {}

  public onAccumulationComplete() {}
}
