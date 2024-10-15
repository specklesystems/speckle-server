import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GDepthPass, DepthType } from '../GDepthPass.js'
import { ObjectVisibility } from '../GPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GViewportPass } from '../GViewportPass.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'

export class ArcticViewPipeline extends GProgressivePipeline {
  protected accumulationFrameCount: number = 32

  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.depthType = DepthType.LINEAR_DEPTH
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)

    const viewportPass = new GViewportPass()
    viewportPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    viewportPass.setVisibility(ObjectVisibility.DEPTH)
    viewportPass.viewportMaterial.falloff = 3
    viewportPass.outputTarget = null

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.options = {
      kernelRadius: 100,
      kernelSize: 32
    }

    const blendPass = new GBlendPass()
    blendPass.setTexture('tDiffuse', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture('tEdges', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(viewportPass)
    this.progressiveStage.push(depthPass, viewportPass, progressiveAOPass, blendPass)
    this.passthroughStage.push(viewportPass, blendPass)

    this.passList = this.dynamicStage
  }
}
