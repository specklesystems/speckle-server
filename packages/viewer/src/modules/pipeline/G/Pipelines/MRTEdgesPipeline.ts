import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GColorPass } from '../GColorPass.js'
import { GEdgePass } from '../GEdgesPass.js'
import { ClearFlags, ObjectVisibility } from '../GPass.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GTAAPass } from '../GTAAPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GStencilMaskPass } from '../GStencilMaskPass.js'
import { GStencilPass } from '../GStencilPass.js'
import { GDepthNormalPass } from '../GDepthNormalPass.js'

export class MRTEdgesPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalPass = new GDepthNormalPass()
    depthNormalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalPass.setJitter(true)
    depthNormalPass.setClearColor(0x000000, 1)
    depthNormalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)
    // const depthPass = new GDepthPass()
    // depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    // depthPass.setVisibility(ObjectVisibility.DEPTH)
    // depthPass.setJitter(true)
    // depthPass.setClearColor(0x000000, 1)
    // depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    // const normalPass = new GNormalsPass()
    // normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    // normalPass.setVisibility(ObjectVisibility.OPAQUE)
    // normalPass.setJitter(true)
    // normalPass.setClearColor(0x000000, 1)
    // normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)
    const depthPassNormalDynamic = new GDepthNormalPass()
    depthPassNormalDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalDynamic.setClearColor(0x000000, 1)
    depthPassNormalDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    // const depthPassDynamic = new GDepthPass()
    // depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    // depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    // depthPassDynamic.setClearColor(0x000000, 1)
    // depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    // const normalPassDynamic = new GNormalsPass()
    // normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    // normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)
    // normalPassDynamic.setClearColor(0x000000, 1)
    // normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const opaqueColorPass = new GColorPass()
    opaqueColorPass.setLayers([
      ObjectLayers.PROPS,
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

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthNormalPass.depthTexture)
    progressiveAOPass.setClearColor(0xffffff, 1)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthNormalPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalPass.normalTexture)

    const edgesPassDynamic = new GEdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalDynamic.normalTexture)

    const taaPass = new GTAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const blendPass = new GBlendPass()
    blendPass.options = { blendAO: true, blendEdges: true }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture('tEdges', taaPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const blendPassDynamic = new GBlendPass()
    blendPassDynamic.options = { blendAO: false, blendEdges: true }
    blendPassDynamic.setTexture('tEdges', edgesPassDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GColorPass()
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])

    this.dynamicStage.push(
      depthPassNormalDynamic,
      edgesPassDynamic,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      blendPassDynamic,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalPass,
      edgesPass,
      progressiveAOPass,
      taaPass,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
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
