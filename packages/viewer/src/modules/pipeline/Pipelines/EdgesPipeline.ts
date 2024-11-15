import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { EdgePass } from '../Passes/EdgesPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { ProgressiveAOPass } from '../Passes/ProgressiveAOPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { StencilPass } from '../Passes/StencilPass.js'

export class EdgesPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new DepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new NormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassDynamic = new DepthPass()
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassDynamic.setClearColor(0x000000, 1)
    depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPassDynamic = new NormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassDynamic.setClearColor(0x000000, 1)
    normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

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
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.setClearColor(0xffffff, 1)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)

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

    const stencilPass = new StencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS
    ])

    this.dynamicStage.push(
      depthPassDynamic,
      normalPassDynamic,
      edgesPassDynamic,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      blendPassDynamic,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      normalPass,
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
