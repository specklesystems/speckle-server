import { BackSide, NoBlending, WebGLRenderTarget } from 'three'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { EdgePass } from '../Passes/EdgesPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { ObjectVisibility } from '../Passes/GPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'

/** WIP */
export class TechnicalViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPassFront = new DepthPass()
    depthPassFront.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFront.setVisibility(ObjectVisibility.DEPTH)
    depthPassFront.setJitter(true)

    const normalPassFront = new NormalsPass()
    normalPassFront.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassFront.setVisibility(ObjectVisibility.OPAQUE)
    normalPassFront.setJitter(true)

    const depthPassBack = new DepthPass()
    depthPassBack.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFront.setVisibility(ObjectVisibility.DEPTH)
    depthPassBack.setJitter(true)
    depthPassBack.overrideMaterial.side = BackSide

    const normalPassBack = new NormalsPass()
    normalPassBack.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassBack.setVisibility(ObjectVisibility.OPAQUE)
    normalPassBack.setJitter(true)
    normalPassBack.overrideMaterial.side = BackSide

    const depthPassFrontDynamic = new DepthPass()
    depthPassFrontDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassFrontDynamic.setVisibility(ObjectVisibility.DEPTH)

    const normalPassFrontDynamic = new NormalsPass()
    normalPassFrontDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassFrontDynamic.setVisibility(ObjectVisibility.OPAQUE)

    const depthPassBackDynamic = new DepthPass()
    depthPassBackDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassBackDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassBackDynamic.overrideMaterial.side = BackSide
    // depthPassBackDynamic.overrideMaterial.depthTest = false

    const normalPassBackDynamic = new NormalsPass()
    normalPassBackDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassBackDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassBackDynamic.overrideMaterial.side = BackSide
    // normalPassBackDynamic.overrideMaterial.depthTest = false

    const edgesPassFront = new EdgePass()
    edgesPassFront.setTexture('tDepth', depthPassFront.outputTarget?.texture)
    edgesPassFront.setTexture('tNormal', normalPassFront.outputTarget?.texture)

    const edgesPassBack = new EdgePass()
    edgesPassBack.setTexture('tDepth', depthPassBack.outputTarget?.texture)
    edgesPassBack.setTexture('tNormal', normalPassBack.outputTarget?.texture)
    edgesPassBack.edgesMaterial.uniforms.uOutlineDensity.value = 0.25
    edgesPassBack.edgesMaterial.needsUpdate = true

    const edgesPassFrontDynamic = new EdgePass()
    edgesPassFrontDynamic.setTexture(
      'tDepth',
      depthPassFrontDynamic.outputTarget?.texture
    )
    edgesPassFrontDynamic.setTexture(
      'tNormal',
      normalPassFrontDynamic.outputTarget?.texture
    )

    const edgesPassBackDynamic = new EdgePass()
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

    const blendPassDynamic = new BlendPass()
    blendPassDynamic.setTexture('tDiffuse', edgesPassFrontDynamic.outputTarget?.texture)
    blendPassDynamic.setTexture('tEdges', edgesPassBackDynamic.outputTarget?.texture)
    blendPassDynamic.accumulationFrames = this.accumulationFrameCount
    blendPassDynamic.materialCopy.transparent = false
    blendPassDynamic.materialCopy.blending = NoBlending

    const blendPass = new BlendPass()
    blendPass.setTexture('tDiffuse', edgesPassFront.outputTarget?.texture)
    blendPass.setTexture('tEdges', edgesPassBack.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount
    blendPass.outputTarget = new WebGLRenderTarget(256, 256)
    blendPass.materialCopy.transparent = false
    blendPass.materialCopy.blending = NoBlending

    const taaPass = new TAAPass()
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
