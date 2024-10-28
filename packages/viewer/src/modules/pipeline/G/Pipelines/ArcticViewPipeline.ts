import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GDepthPass } from '../GDepthPass.js'
import { ClearFlags, ObjectVisibility } from '../GPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GViewportPass } from '../GViewportPass.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GColorPass } from '../GColorPass.js'
import { GStencilPass } from '../GStencilPass.js'
import { GStencilMaskPass } from '../GStencilMaskPass.js'

export class ArcticViewPipeline extends GProgressivePipeline {
  protected accumulationFrameCount: number = 16

  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const viewportPass = new GViewportPass()
    viewportPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    viewportPass.setVisibility(ObjectVisibility.OPAQUE)
    viewportPass.options = { minIntensity: 0.75 }

    const viewportTransparentPass = new GViewportPass()
    viewportTransparentPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    viewportTransparentPass.setVisibility(ObjectVisibility.TRANSPARENT)
    viewportTransparentPass.options = { minIntensity: 0.25, opacity: 0.5 }

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.options = {
      kernelRadius: 100,
      kernelSize: 64
    }
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
      viewportPass,
      viewportTransparentPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      stencilPass,
      viewportPass,
      viewportTransparentPass,
      stencilMaskPass,
      progressiveAOPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      viewportPass,
      viewportTransparentPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
