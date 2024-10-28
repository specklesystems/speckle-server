import { ObjectLayers, WorldTree } from '../../../index.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { Pipeline } from './Pipeline.js'
import { BasitPass } from '../Passes/BasitPass.js'
import { ClearFlags } from '../Passes/GPass.js'

export class BasitPipeline extends Pipeline {
  constructor(speckleRenderer: SpeckleRenderer, tree: WorldTree) {
    super(speckleRenderer)

    const basitPass = new BasitPass(tree, speckleRenderer)
    basitPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    basitPass.setClearColor(0x000000, 0)
    basitPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL)
    basitPass.outputTarget = null

    const transparentColorPass = new GeometryPass()
    transparentColorPass.setLayers([ObjectLayers.SHADOWCATCHER])
    transparentColorPass.outputTarget = null

    this.passList.push(basitPass, transparentColorPass)
  }
}
