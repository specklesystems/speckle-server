import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { BlendPass } from '../../Passes/BlendPass.js'
import { GeometryPass } from '../../Passes/GeometryPass.js'
import { EdgePass } from '../../Passes/EdgesPass.js'
import { ClearFlags, ObjectVisibility } from '../../Passes/GPass.js'
import { ProgressiveAOPass } from '../../Passes/ProgressiveAOPass.js'
import { TAAPass } from '../../Passes/TAAPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { ProgressivePipeline } from '../ProgressivePipeline.js'
import { StencilMaskPass } from '../../Passes/StencilMaskPass.js'
import { StencilPass } from '../../Passes/StencilPass.js'
import { DepthNormalIdPass } from '../../Passes/DepthNormalIdPass.js'

export class MRTEdgesPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalIdPass = new DepthNormalIdPass()
    depthNormalIdPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalIdPass.setJitter(true)
    depthNormalIdPass.setClearColor(0x000000, 1)
    depthNormalIdPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalIdDynamic = new DepthNormalIdPass()
    depthPassNormalIdDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalIdDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalIdDynamic.setClearColor(0x000000, 1)
    depthPassNormalIdDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const opaqueColorPass = new GeometryPass()
    opaqueColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    opaqueColorPass.setVisibility(ObjectVisibility.OPAQUE)

    const transparentColorPass = new GeometryPass()
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

    const progressiveAOPass = new ProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    progressiveAOPass.setClearColor(0xffffff, 1)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalIdPass.normalTexture)
    edgesPass.setTexture('tId', depthNormalIdPass.idTexture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalIdDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalIdDynamic.normalTexture)
    edgesPassDynamic.setTexture('tId', depthPassNormalIdDynamic.idTexture)

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: true, blendEdges: true }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture('tEdges', taaPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const blendPassDynamic = new BlendPass()
    blendPassDynamic.options = { blendAO: false, blendEdges: true }
    blendPassDynamic.setTexture('tEdges', edgesPassDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount

    const postBlendGeometryPass = new GeometryPass()
    postBlendGeometryPass.setLayers([ObjectLayers.PROPS])

    const stencilPass = new StencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])

    this.dynamicStage.push(
      depthPassNormalIdDynamic,
      edgesPassDynamic,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      blendPassDynamic,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalIdPass,
      edgesPass,
      progressiveAOPass,
      taaPass,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      blendPass,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      blendPass,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
