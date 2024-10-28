import { ObjectLayers } from '../../../index.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GColorPass } from '../Passes/GColorPass.js'
import { GDepthPass } from '../Passes/GDepthPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { GProgressiveAOPass } from '../Passes/GProgressiveAOPass.js'
import { GBlendPass } from '../Passes/GBlendPass.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GStencilPass } from '../Passes/GStencilPass.js'
import { GStencilMaskPass } from '../Passes/GStencilMaskPass.js'

export class DefaultPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const opaqueColorPass = new GColorPass()
    opaqueColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    opaqueColorPass.setVisibility(ObjectVisibility.OPAQUE)

    const transparentColorPass = new GColorPass()
    transparentColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    transparentColorPass.setVisibility(ObjectVisibility.TRANSPARENT)

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.setClearColor(0xffffff, 1)

    const blendPass = new GBlendPass()
    blendPass.options = { blendAO: true, blendEdges: false }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GColorPass()
    overlayPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS
    ])

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
