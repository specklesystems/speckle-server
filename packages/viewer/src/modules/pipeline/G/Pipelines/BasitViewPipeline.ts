import { ObjectLayers, WorldTree } from '../../../../index.js'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GColorPass } from '../GColorPass.js'
import { GPipeline } from './GPipeline.js'
import { GBasitPass } from '../GBasitPass.js'

export class BasitPipeline extends GPipeline {
  constructor(speckleRenderer: SpeckleRenderer, tree: WorldTree) {
    super(speckleRenderer)

    const basitPass = new GBasitPass(tree, speckleRenderer)
    basitPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    basitPass.outputTarget = null

    const transparentColorPass = new GColorPass()
    transparentColorPass.setLayers([ObjectLayers.SHADOWCATCHER])
    transparentColorPass.outputTarget = null

    this.passList.push(basitPass, transparentColorPass)
  }
}
