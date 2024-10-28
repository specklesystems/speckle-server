import { ObjectLayers, AssetType } from '../../../../index.js'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { BlendPass } from '../../Passes/BlendPass.js'
import { GeometryPass } from '../../Passes/GeometryPass.js'
import { EdgePass } from '../../Passes/EdgesPass.js'
import { ClearFlags, ObjectVisibility } from '../../Passes/GPass.js'
import { StencilMaskPass } from '../../Passes/StencilMaskPass.js'
import { StencilPass } from '../../Passes/StencilPass.js'
import { TAAPass } from '../../Passes/TAAPass.js'
import { ViewportPass } from '../../Passes/ViewportPass.js'
import { ProgressivePipeline } from '../ProgressivePipeline.js'
import defaultMatcap from '../../../../assets/matcap.png'
import { DepthNormalPass } from '../../Passes/DepthNormalPass.js'

export class MRTShadedViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalPass = new DepthNormalPass()
    depthNormalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalPass.setJitter(true)
    depthNormalPass.setClearColor(0x000000, 1)
    depthNormalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalDynamic = new DepthNormalPass()
    depthPassNormalDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalDynamic.setClearColor(0x000000, 1)
    depthPassNormalDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const viewportPass = new ViewportPass()
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

    const shadowcatcherPass = new GeometryPass()
    shadowcatcherPass.setLayers([ObjectLayers.SHADOWCATCHER])

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthNormalPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalPass.normalTexture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalDynamic.normalTexture)

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: false, blendEdges: true }
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
      depthPassNormalDynamic,
      edgesPassDynamic,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      stencilMaskPass,
      blendPassDynamic,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalPass,
      edgesPass,
      taaPass,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      stencilMaskPass,
      blendPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
