import { OrthographicCamera, PerspectiveCamera } from 'three'
import { ObjectLayers } from '../../../index.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GColorPass } from './GColorPass.js'
import { DepthType, GDepthPass } from './GDepthPass.js'
import { GPass, ObjectVisibility, ProgressiveGPass } from './GPass.js'
import { GPipeline } from './GPipeline.js'
import { GProgressiveAOPass } from './GProgressiveAOPass.js'
import { GBlendPass } from './GBlendPass.js'
import { GOutputPass, InputType } from './GOutputPass.js'
import { GTAAPass } from './GTAAPass.js'
import { GNormalsPass } from './GNormalPass.js'
import { GEdgePass } from './GEdgesPass.js'

export class EdgesPipeline extends GPipeline {
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

    const opaqueColorPass = new GColorPass()
    opaqueColorPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    opaqueColorPass.setVisibility(ObjectVisibility.OPAQUE)
    opaqueColorPass.outputTarget = null

    const transparentColorPass = new GColorPass()
    transparentColorPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    transparentColorPass.setVisibility(ObjectVisibility.TRANSPARENT)
    transparentColorPass.outputTarget = null

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount

    const blendPass = new GBlendPass()
    blendPass.setTexture('tDiffuse', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const jitterOpaquePass = new GColorPass()
    jitterOpaquePass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    jitterOpaquePass.setVisibility(ObjectVisibility.OPAQUE)
    jitterOpaquePass.setJitter(true)
    jitterOpaquePass.clear = true

    const jitterTransparentPass = new GColorPass()
    jitterTransparentPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    jitterTransparentPass.setVisibility(ObjectVisibility.TRANSPARENT)
    jitterTransparentPass.setJitter(true)
    jitterTransparentPass.outputTarget = jitterOpaquePass.outputTarget

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const taaPass = new GTAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const outputPassDynamic = new GOutputPass()
    outputPassDynamic.setTexture('tDiffuse', edgesPass.outputTarget?.texture)
    outputPassDynamic.setInputType(InputType.Color)

    const outputPassProgressive = new GOutputPass()
    outputPassProgressive.setTexture('tDiffuse', taaPass.outputTarget?.texture)
    outputPassProgressive.setInputType(InputType.Color)

    this.dynamicStage.push(depthPass, normalPass, edgesPass, outputPassDynamic)
    this.progressiveStage.push(
      depthPass,
      normalPass,
      edgesPass,
      taaPass,
      outputPassProgressive
    )

    this.passList = this.dynamicStage
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
