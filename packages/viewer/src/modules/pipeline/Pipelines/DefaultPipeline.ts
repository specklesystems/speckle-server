import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { ProgressiveAOPass } from '../Passes/ProgressiveAOPass.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { EdgesPipeline } from './EdgesPipeline.js'
import { ObjectLayers } from '../../../IViewer.js'
import { DefaultPipelineOptions, PipelineOptions } from './Pipeline.js'

export class DefaultPipeline extends ProgressivePipeline {
  constructor(
    speckleRenderer: SpeckleRenderer,
    options: PipelineOptions = DefaultPipelineOptions
  ) {
    super(speckleRenderer)

    const edgesPipeline = options.edges ? new EdgesPipeline(speckleRenderer) : null

    const depthPass = !options.edges ? new DepthPass() : null
    if (depthPass) {
      depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
      depthPass.setVisibility(ObjectVisibility.DEPTH)
      depthPass.setJitter(true)
      depthPass.setClearColor(0x000000, 1)
      depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)
    }
    const depthTex = options.edges
      ? edgesPipeline?.depthPass.depthTexture
      : depthPass?.outputTarget?.texture

    const depthSubPipelineDynamic =
      (options.edges ? edgesPipeline?.dynamicPasses : []) || []
    const depthSubPipelineProgressive =
      (options.edges
        ? edgesPipeline?.progressivePasses
        : depthPass
        ? [depthPass]
        : []) || []

    const opaqueColorPass = new GeometryPass()
    opaqueColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.PROPS
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
    progressiveAOPass.setTexture('tDepth', depthTex)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.setClearColor(0xffffff, 1)

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: true, blendEdges: options.edges }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture(
      'tEdges',
      options.edges ? edgesPipeline?.outputTexture : undefined
    )
    blendPass.accumulationFrames = this.accumulationFrameCount

    const blendPassDynamic = new BlendPass()
    blendPassDynamic.options = { blendAO: false, blendEdges: options.edges }
    blendPassDynamic.setTexture(
      'tEdges',
      options.edges ? edgesPipeline?.outputTextureDynamic : undefined
    )
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount

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
      ...depthSubPipelineDynamic,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      ...(options.edges ? [blendPassDynamic] : []),
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      ...depthSubPipelineProgressive,
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
