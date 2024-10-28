import SpeckleRenderer from '../../SpeckleRenderer.js'
import { GBlendPass } from '../Passes/GBlendPass.js'
import { GDepthPass } from '../Passes/GDepthPass.js'
import { GEdgePass } from '../Passes/GEdgesPass.js'
import { GNormalsPass } from '../Passes/GNormalPass.js'
import { GTAAPass } from '../Passes/GTAAPass.js'
import { AssetType, ObjectLayers } from '../../../IViewer.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GColorPass } from '../Passes/GColorPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { GStencilMaskPass } from '../Passes/GStencilMaskPass.js'
import { GStencilPass } from '../Passes/GStencilPass.js'
import { GViewportPass } from '../Passes/GViewportPass.js'
import defaultMatcap from '../../../assets/matcap.png'

export class ShadedViewPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new GNormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassDynamic = new GDepthPass()
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setClearColor(0x000000, 1)
    depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPassDynamic = new GNormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setClearColor(0x000000, 1)
    normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const viewportPass = new GViewportPass()
    viewportPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    viewportPass.options = {
      matcapTexture: {
        id: 'defaultMatcap',
        src: defaultMatcap,
        type: AssetType.TEXTURE_8BPP
      }
    }

    const shadowcatcherPass = new GColorPass()
    shadowcatcherPass.setLayers([ObjectLayers.SHADOWCATCHER])

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
    blendPass.options = { blendAO: false, blendEdges: true }
    blendPass.setTexture('tEdges', taaPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const blendPassDynamic = new GBlendPass()
    blendPassDynamic.options = { blendAO: false, blendEdges: true }
    blendPassDynamic.setTexture('tEdges', edgesPassDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GColorPass()
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
      viewportPass,
      shadowcatcherPass,
      stencilMaskPass,
      blendPassDynamic,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      normalPass,
      edgesPass,
      taaPass,
      stencilPass,
      viewportPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      viewportPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
