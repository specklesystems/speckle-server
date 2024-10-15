import { ObjectLayers } from '../../../../index.js'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GColorPass } from '../GColorPass.js'
import { DepthType, GDepthPass } from '../GDepthPass.js'
import { ObjectVisibility } from '../GPass.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GBlendPass } from '../GBlendPass.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GStencilPass } from '../GStencilPass.js'
import { GStencilMaskPass } from '../GStencilMaskPass.js'

export class DefaultPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.depthType = DepthType.LINEAR_DEPTH
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)

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
    blendPass.setTexture('tEdges', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const overlayPass = new GColorPass()
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])
    overlayPass.outputTarget = null

    this.dynamicStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      progressiveAOPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
