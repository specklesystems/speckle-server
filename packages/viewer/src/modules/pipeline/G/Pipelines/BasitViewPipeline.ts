import { OrthographicCamera, PerspectiveCamera } from 'three'
import { ObjectLayers, WorldTree } from '../../../../index.js'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GColorPass } from '../GColorPass.js'
import { GPass, ProgressiveGPass } from '../GPass.js'
import { GPipeline } from '../GPipeline.js'
import { GBasitPass } from '../GBasitPass.js'

export class BasitPipeline extends GPipeline {
  protected accumulationFrameIndex: number = 0
  protected accumulationFrameCount: number = 16
  protected dynamicStage: Array<GPass> = []
  protected progressiveStage: Array<GPass> = []

  constructor(speckleRenderer: SpeckleRenderer, tree: WorldTree) {
    super(speckleRenderer)

    const basitPass = new GBasitPass(tree, speckleRenderer)
    basitPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    basitPass.outputTarget = null

    const transparentColorPass = new GColorPass()
    transparentColorPass.setLayers([ObjectLayers.SHADOWCATCHER])
    transparentColorPass.outputTarget = null

    this.passList.push(basitPass, transparentColorPass)
  }

  public update(camera: PerspectiveCamera | OrthographicCamera): void {
    this.passList.forEach((pass: GPass) => {
      pass.enabled && pass.update?.(camera)
      if (pass instanceof ProgressiveGPass) {
        pass.frameIndex = this.accumulationFrameIndex
      }
    })
    this.accumulationFrameIndex++

    if (this.accumulationFrameIndex === this.accumulationFrameCount)
      this.onAccumulationComplete()
  }

  public resize(width: number, height: number) {
    this.dynamicStage.forEach((pass: GPass) => pass.setSize?.(width, height))
    this.progressiveStage.forEach((pass: GPass) => pass.setSize?.(width, height))
  }
}
