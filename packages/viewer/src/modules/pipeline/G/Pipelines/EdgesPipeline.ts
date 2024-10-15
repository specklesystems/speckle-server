import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GColorPass } from '../GColorPass.js'
import { GDepthPass, DepthType } from '../GDepthPass.js'
import { GEdgePass } from '../GEdgesPass.js'
import { GNormalsPass } from '../GNormalPass.js'
import { ObjectVisibility } from '../GPass.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GTAAPass } from '../GTAAPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'

export class EdgesPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.depthType = DepthType.LINEAR_DEPTH
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)

    const normalPass = new GNormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)

    const depthPassDynamic = new GDepthPass()
    depthPassDynamic.depthType = DepthType.LINEAR_DEPTH
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)

    const normalPassDynamic = new GNormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)

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
    opaqueColorPass.outputTarget = null

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
    transparentColorPass.outputTarget = null

    const progressiveAOPass = new GProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const edgesPassDynamic = new GEdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)

    const taaPass = new GTAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const blendPass = new GBlendPass()
    blendPass.setTexture('tDiffuse', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture('tEdges', taaPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const blendPassDynamic = new GBlendPass()
    blendPassDynamic.setTexture('tDiffuse', edgesPassDynamic.outputTarget?.texture)
    blendPassDynamic.setTexture('tEdges', edgesPassDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(
      depthPassDynamic,
      normalPassDynamic,
      edgesPassDynamic,
      opaqueColorPass,
      transparentColorPass,
      blendPassDynamic
    )
    this.progressiveStage.push(
      depthPass,
      normalPass,
      edgesPass,
      progressiveAOPass,
      taaPass,
      opaqueColorPass,
      transparentColorPass,
      blendPass
    )
    this.passthroughStage.push(opaqueColorPass, transparentColorPass, blendPass)

    this.passList = this.dynamicStage
  }
}
