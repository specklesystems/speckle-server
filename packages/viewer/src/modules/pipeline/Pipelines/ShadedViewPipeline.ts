import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { ShadedPass } from '../Passes/ShadedPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { PipelineOptions, DefaultPipelineOptions } from './Pipeline.js'
import { WorldTree } from '../../tree/WorldTree.js'
import { EdgesPipeline } from './EdgesPipeline.js'
import { ObjectLayers } from '../../../IViewer.js'
import { BlendPass } from '../Passes/BlendPass.js'

export class ShadedViewPipeline extends ProgressivePipeline {
  constructor(
    speckleRenderer: SpeckleRenderer,
    options: PipelineOptions = DefaultPipelineOptions,
    tree: WorldTree
  ) {
    super(speckleRenderer)

    const edgesPipeline = options.edges ? new EdgesPipeline(speckleRenderer) : null
    /** We'll just render all objects outlines, not just opaque */
    /** Alex 01.08.2025: I don't think this is needed anymore. */
    // edgesPipeline?.depthPass.setVisibility(null)
    // edgesPipeline?.depthPassDynamic.setVisibility(null)

    const depthSubPipelineDynamic =
      (options.edges ? edgesPipeline?.dynamicPasses : []) || []
    const depthSubPipelineProgressive =
      (options.edges ? edgesPipeline?.progressivePasses : []) || []

    const basitPass = new ShadedPass(tree, speckleRenderer)
    basitPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH, ObjectLayers.PROPS])
    basitPass.setClearColor(0x000000, 0)
    basitPass.setClearFlags(ClearFlags.COLOR)
    basitPass.outputTarget = null

    const nonMeshPass = new GeometryPass()
    nonMeshPass.setLayers([
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: false, blendEdges: options.edges }
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
      basitPass,
      nonMeshPass,
      ...(options.edges ? [blendPassDynamic] : []),
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      ...depthSubPipelineProgressive,
      stencilPass,
      basitPass,
      nonMeshPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      basitPass,
      nonMeshPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
