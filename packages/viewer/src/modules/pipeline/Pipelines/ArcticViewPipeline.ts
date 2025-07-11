import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressiveAOPass } from '../Passes/ProgressiveAOPass.js'
import { ViewportPass } from '../Passes/ViewportPass.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { DefaultPipelineOptions, PipelineOptions } from './Pipeline.js'
import { EdgesPipeline } from './EdgesPipeline.js'

export class ArcticViewPipeline extends ProgressivePipeline {
  protected accumulationFrameCount: number = 16

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

    const viewportPass = new ViewportPass()
    viewportPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.PROPS
    ])
    viewportPass.setVisibility(ObjectVisibility.OPAQUE)
    viewportPass.options = { minIntensity: 0.75 }

    const viewportTransparentPass = new ViewportPass()
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

    const progressiveAOPass = new ProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthTex)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.options = {
      kernelRadius: 100,
      kernelSize: 64
    }
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
      viewportPass,
      viewportTransparentPass,
      ...(options.edges ? [blendPassDynamic] : []),
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      ...depthSubPipelineProgressive,
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
