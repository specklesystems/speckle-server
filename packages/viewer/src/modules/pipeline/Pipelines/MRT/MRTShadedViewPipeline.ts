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
import { DepthNormalIdPass } from '../../Passes/DepthNormalIdPass.js'

export class MRTShadedViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalIdPass = new DepthNormalIdPass()
    depthNormalIdPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalIdPass.setJitter(true)
    depthNormalIdPass.setClearColor(0x000000, 1)
    depthNormalIdPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalIdDynamic = new DepthNormalIdPass()
    depthPassNormalIdDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalIdDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalIdDynamic.setClearColor(0x000000, 1)
    depthPassNormalIdDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const viewportPass = new ViewportPass()
    viewportPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.PROPS
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
    edgesPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalIdPass.normalTexture)
    edgesPass.setTexture('tId', depthNormalIdPass.idTexture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalIdDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalIdDynamic.normalTexture)
    edgesPassDynamic.setTexture('tId', depthPassNormalIdDynamic.idTexture)

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

    this.dynamicStage.push(
      depthPassNormalIdDynamic,
      edgesPassDynamic,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      blendPassDynamic,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalIdPass,
      edgesPass,
      taaPass,
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      blendPass,
      postBlendGeometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.passthroughStage.push(
      stencilPass,
      shadowcatcherPass,
      viewportPass,
      blendPass,
      stencilMaskPass,
      postBlendGeometryPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
