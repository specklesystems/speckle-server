import { BackSide, NoBlending, WebGLRenderTarget } from 'three'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GDepthPass, DepthType } from '../GDepthPass.js'
import { GEdgePass } from '../GEdgesPass.js'
import { GNormalsPass } from '../GNormalPass.js'
import { ObjectVisibility } from '../GPass.js'
import { GTAAPass } from '../GTAAPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'

export class TechnicalViewPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPassFront = new GDepthPass()
    depthPassFront.depthType = DepthType.LINEAR_DEPTH
    depthPassFront.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFront.setVisibility(ObjectVisibility.DEPTH)
    depthPassFront.setJitter(true)

    const normalPassFront = new GNormalsPass()
    normalPassFront.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassFront.setVisibility(ObjectVisibility.OPAQUE)
    normalPassFront.setJitter(true)

    const depthPassBack = new GDepthPass()
    depthPassBack.depthType = DepthType.LINEAR_DEPTH
    depthPassBack.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFront.setVisibility(ObjectVisibility.DEPTH)
    depthPassBack.setJitter(true)
    depthPassBack.overrideMaterial.side = BackSide

    const normalPassBack = new GNormalsPass()
    normalPassBack.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassBack.setVisibility(ObjectVisibility.OPAQUE)
    normalPassBack.setJitter(true)
    normalPassBack.overrideMaterial.side = BackSide

    const depthPassFrontDynamic = new GDepthPass()
    depthPassFrontDynamic.depthType = DepthType.LINEAR_DEPTH
    depthPassFrontDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFrontDynamic.setVisibility(ObjectVisibility.DEPTH)

    const normalPassFrontDynamic = new GNormalsPass()
    normalPassFrontDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassFrontDynamic.setVisibility(ObjectVisibility.OPAQUE)

    const depthPassBackDynamic = new GDepthPass()
    depthPassBackDynamic.depthType = DepthType.LINEAR_DEPTH
    depthPassBackDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassBackDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassBackDynamic.overrideMaterial.side = BackSide
    // depthPassBackDynamic.overrideMaterial.depthTest = false

    const normalPassBackDynamic = new GNormalsPass()
    normalPassBackDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassBackDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassBackDynamic.overrideMaterial.side = BackSide
    // normalPassBackDynamic.overrideMaterial.depthTest = false

    const edgesPassFront = new GEdgePass()
    edgesPassFront.setTexture('tDepth', depthPassFront.outputTarget?.texture)
    edgesPassFront.setTexture('tNormal', normalPassFront.outputTarget?.texture)

    const edgesPassBack = new GEdgePass()
    edgesPassBack.setTexture('tDepth', depthPassBack.outputTarget?.texture)
    edgesPassBack.setTexture('tNormal', normalPassBack.outputTarget?.texture)
    edgesPassBack.edgesMaterial.uniforms.uOutlineDensity.value = 0.25
    edgesPassBack.edgesMaterial.needsUpdate = true

    const edgesPassFrontDynamic = new GEdgePass()
    edgesPassFrontDynamic.setTexture(
      'tDepth',
      depthPassFrontDynamic.outputTarget?.texture
    )
    edgesPassFrontDynamic.setTexture(
      'tNormal',
      normalPassFrontDynamic.outputTarget?.texture
    )

    const edgesPassBackDynamic = new GEdgePass()
    edgesPassBackDynamic.setTexture(
      'tDepth',
      depthPassBackDynamic.outputTarget?.texture
    )
    edgesPassBackDynamic.setTexture(
      'tNormal',
      normalPassBackDynamic.outputTarget?.texture
    )
    edgesPassBackDynamic.edgesMaterial.uniforms.uOutlineDensity.value = 0.25
    edgesPassBackDynamic.edgesMaterial.needsUpdate = true

    const blendPassDynamic = new GBlendPass()
    blendPassDynamic.setTexture('tDiffuse', edgesPassFrontDynamic.outputTarget?.texture)
    blendPassDynamic.setTexture('tEdges', edgesPassBackDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount
    blendPassDynamic.materialCopy.transparent = false
    blendPassDynamic.materialCopy.blending = NoBlending

    const blendPass = new GBlendPass()
    blendPass.setTexture('tDiffuse', edgesPassFront.outputTarget?.texture)
    blendPass.setTexture('tEdges', edgesPassBack.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount
    blendPass.outputTarget = new WebGLRenderTarget(256, 256)
    blendPass.materialCopy.transparent = false
    blendPass.materialCopy.blending = NoBlending

    const taaPass = new GTAAPass()
    taaPass.inputTexture = blendPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount
    taaPass.outputToScreen = true

    this.dynamicStage.push(
      depthPassFrontDynamic,
      normalPassFrontDynamic,
      depthPassBackDynamic,
      normalPassBackDynamic,
      edgesPassBackDynamic,
      edgesPassFrontDynamic,
      blendPassDynamic
    )
    this.progressiveStage.push(
      depthPassFront,
      normalPassFront,
      depthPassBack,
      normalPassBack,
      edgesPassFront,
      edgesPassBack,
      blendPass,
      taaPass
    )

    this.passList = this.dynamicStage
  }
}
