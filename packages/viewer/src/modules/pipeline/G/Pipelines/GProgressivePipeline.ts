import { OrthographicCamera, PerspectiveCamera } from 'three'
import { GPass, ProgressiveGPass } from '../GPass.js'
import { GPipeline } from './GPipeline.js'

export abstract class GProgressivePipeline extends GPipeline {
  protected accumulationFrameIndex: number = 0
  protected accumulationFrameCount: number = 16
  protected dynamicStage: Array<GPass> = []
  protected progressiveStage: Array<GPass> = []

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
    super.resize(width, height)
    this.dynamicStage.forEach((pass: GPass) => pass.setSize?.(width, height))
    this.progressiveStage.forEach((pass: GPass) => pass.setSize?.(width, height))
  }

  public onStationaryBegin() {
    this.accumulationFrameIndex = 0
    this.passList = this.progressiveStage
  }

  public onStationaryEnd() {
    this.passList = this.dynamicStage
  }

  public onAccumulationComplete() {
    console.warn('Accumulation Complete')
  }
}
