import { PerspectiveCamera, OrthographicCamera, RepeatWrapping, Texture } from 'three'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GDepthPass, DepthType } from '../GDepthPass.js'
import { GEdgePass } from '../GEdgesPass.js'
import { GNormalsPass } from '../GNormalPass.js'
import { GPass, ObjectVisibility, ProgressiveGPass } from '../GPass.js'
import { GPipeline } from '../GPipeline.js'
import { GTAAPass } from '../GTAAPass.js'
import { AssetType, ObjectLayers } from '../../../../IViewer.js'
import { Assets } from '../../../Assets.js'
import paperTex from '../../../../assets/paper.png'
import Logger from '../../../utils/Logger.js'

export class PenViewPipeline extends GPipeline {
  protected accumulationFrameIndex: number = 0
  protected accumulationFrameCount: number = 16
  protected dynamicStage: Array<GPass> = []
  protected progressiveStage: Array<GPass> = []

  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.depthType = DepthType.LINEAR_DEPTH
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)

    const normalPass = new GNormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)

    const depthPassDynamic = new GDepthPass()
    depthPassDynamic.depthType = DepthType.LINEAR_DEPTH
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)

    const normalPassDynamic = new GNormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const edgesPassDynamic = new GEdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)
    edgesPassDynamic.outputTarget = null

    const taaPass = new GTAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount
    taaPass.outputToScreen = true

    this.dynamicStage.push(depthPassDynamic, normalPassDynamic, edgesPassDynamic)
    this.progressiveStage.push(depthPass, normalPass, edgesPass, taaPass)

    this.passList = this.progressiveStage

    Assets.getTexture({
      id: 'paper',
      src: paperTex,
      type: AssetType.TEXTURE_8BPP
    })
      .then((value: Texture) => {
        value.wrapS = RepeatWrapping
        value.wrapT = RepeatWrapping
        edgesPass.setBackground(value)
        edgesPassDynamic.setBackground(value)
        this.accumulationFrameIndex = 0
      })
      .catch((reason) => {
        Logger.error(`Matcap texture failed to load ${reason}`)
      })
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
