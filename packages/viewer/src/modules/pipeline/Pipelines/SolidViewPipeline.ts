import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { AssetType, ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { ViewportPass } from '../Passes/ViewportPass.js'
import defaultMatcap from '../../../assets/matcap.png'
import { DefaultPipelineOptions, PipelineOptions } from './Pipeline.js'
import { EdgesPipeline } from './EdgesPipeline.js'

export class SolidViewPipeline extends ProgressivePipeline {
  constructor(
    speckleRenderer: SpeckleRenderer,
    options: PipelineOptions = DefaultPipelineOptions
  ) {
    super(speckleRenderer)

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
    viewportPass.options = {
      matcapTexture: {
        id: 'defaultMatcap',
        src: defaultMatcap,
        type: AssetType.TEXTURE_8BPP
      }
    }

    const viewportTransparentPass = new ViewportPass()
    viewportTransparentPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    viewportTransparentPass.setVisibility(ObjectVisibility.TRANSPARENT)
    viewportTransparentPass.options = {
      opacity: 0.5,
      matcapTexture: {
        id: 'defaultMatcap',
        src: defaultMatcap,
        type: AssetType.TEXTURE_8BPP
      }
    }

    const shadowcatcherPass = new GeometryPass()
    shadowcatcherPass.setLayers([ObjectLayers.SHADOWCATCHER])

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

    const edgesPipeline = options.edges ? new EdgesPipeline(speckleRenderer) : null
    let blendPass = null
    let blendPassDynamic = null
    if (edgesPipeline) {
      blendPass = new BlendPass()
      blendPass.options = { blendAO: false, blendEdges: true }
      blendPass.setTexture('tEdges', edgesPipeline.outputTexture)
      blendPass.accumulationFrames = this.accumulationFrameCount

      blendPassDynamic = new BlendPass()
      blendPassDynamic.options = { blendAO: false, blendEdges: true }
      blendPassDynamic.setTexture('tEdges', edgesPipeline.outputTextureDynamic)
      blendPassDynamic.accumulationFrames = this.accumulationFrameCount
    }

    const depthSubPipelineDynamic =
      (options.edges ? edgesPipeline?.dynamicPasses : []) || []
    const depthSubPipelineProgressive =
      (options.edges ? edgesPipeline?.progressivePasses : []) || []
    const blendSubpipelineDynamic = options.edges
      ? blendPassDynamic
        ? [blendPassDynamic]
        : []
      : []
    const blendSubpipelineProgressive = options.edges
      ? blendPass
        ? [blendPass]
        : []
      : []

    this.dynamicStage.push(
      ...depthSubPipelineDynamic,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      viewportTransparentPass,
      ...blendSubpipelineDynamic,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      ...depthSubPipelineProgressive,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      viewportTransparentPass,
      ...blendSubpipelineProgressive,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      viewportTransparentPass,
      ...blendSubpipelineProgressive,
      stencilMaskPass,
      postBlendGeometryPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
