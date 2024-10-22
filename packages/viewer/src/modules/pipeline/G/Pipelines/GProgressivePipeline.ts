import { OrthographicCamera, PerspectiveCamera } from 'three'
import { GPass, ProgressiveGPass } from '../GPass.js'
import { GPipeline } from './GPipeline.js'

export abstract class GProgressivePipeline extends GPipeline {
  protected accumulationFrameIndex: number = 0
  protected accumulationFrameCount: number = 16
  protected dynamicStage: Array<GPass> = []
  protected progressiveStage: Array<GPass> = []
  protected passthroughStage: Array<GPass> = []
  protected accumulating = false

  public get passes(): Array<GPass> {
    return [...this.dynamicStage, ...this.progressiveStage, ...this.passthroughStage]
  }

  public getPass(name: string): GPass[] {
    return [
      ...this.dynamicStage.filter((pass: GPass) => {
        return pass.displayName === name
      }),
      ...this.progressiveStage.filter((pass: GPass) => {
        return pass.displayName === name
      }),
      ...this.passthroughStage.filter((pass: GPass) => {
        return pass.displayName === name
      })
    ]
  }

  public update(camera: PerspectiveCamera | OrthographicCamera): void {
    this.passList.forEach((pass: GPass) => {
      pass.enabled && pass.update?.(camera)
      if (pass instanceof ProgressiveGPass) {
        pass.frameIndex = this.accumulationFrameIndex
      }
    })
  }

  public render(): boolean {
    const ret = super.render()

    if (this.accumulating) {
      if (++this.accumulationFrameIndex === this.accumulationFrameCount)
        this.onAccumulationComplete()
    }
    return ret
  }

  public reset() {
    this.accumulationFrameIndex = 0
    this.onStationaryBegin()
  }

  public resize(width: number, height: number) {
    super.resize(width, height)
    this.dynamicStage.forEach((pass: GPass) => pass.setSize?.(width, height))
    this.progressiveStage.forEach((pass: GPass) => pass.setSize?.(width, height))
  }

  public onStationaryBegin() {
    this.accumulationFrameIndex = 0
    this.accumulating = true
    this.passList = this.progressiveStage
  }

  public onStationaryEnd() {
    this.accumulating = false
    this.passList = this.dynamicStage
  }

  public onAccumulationComplete() {
    this.accumulating = false
    this.passList = this.passthroughStage
  }
}
