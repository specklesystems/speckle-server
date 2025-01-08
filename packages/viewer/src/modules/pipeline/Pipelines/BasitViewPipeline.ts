import { ObjectLayers, WorldTree } from '../../../index.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { Pipeline } from './Pipeline.js'
import { BasitPass } from '../Passes/BasitPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'

export class BasitPipeline extends Pipeline {
  constructor(speckleRenderer: SpeckleRenderer, tree: WorldTree) {
    super(speckleRenderer)

    const basitPass = new BasitPass(tree, speckleRenderer)
    basitPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
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

    this.passList.push(
      stencilPass,
      basitPass,
      nonMeshPass,
      stencilMaskPass,
      overlayPass
    )
  }
}
