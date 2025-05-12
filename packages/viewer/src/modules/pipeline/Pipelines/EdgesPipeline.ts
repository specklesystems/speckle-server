import SpeckleRenderer from '../../SpeckleRenderer.js'
import { EdgesPass } from '../Passes/EdgesPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { DepthNormalIdPass } from '../Passes/DepthNormalIdPass.js'
import { Texture } from 'three'
import { DepthPass } from '../Passes/DepthPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { BasePipelineOptions } from './Pipeline.js'

export interface EdgesPipelineOptions extends BasePipelineOptions {
  outlineThickness?: number
  outlineColor?: number
  outlineOpacity?: number
}

export const DefaultEdgesPipelineOptions = {
  outlineThickness: 1,
  outlineOpacity: 0.75,
  outlineColor: 0x323232
}

export class EdgesPipeline extends ProgressivePipeline {
  public depthPass: DepthNormalIdPass | DepthPass
  public depthPassDynamic: DepthNormalIdPass | DepthPass
  public edgePass: EdgesPass
  public edgePassDynamic: EdgesPass
  public outputTexture?: Texture
  public outputTextureDynamic?: Texture

  constructor(
    speckleRenderer: SpeckleRenderer,
    options: EdgesPipelineOptions = DefaultEdgesPipelineOptions
  ) {
    super(speckleRenderer, options)

    const isMRTCapable =
      speckleRenderer.renderer.capabilities.isWebGL2 ||
      speckleRenderer.renderer.context.getExtension('WEBGL_draw_buffers') !== null

    if (isMRTCapable) this.MRTPipeline(options)
    else this.SRTPipeline(options)
  }

  protected MRTPipeline(options: EdgesPipelineOptions) {
    const depthNormalIdPass = new DepthNormalIdPass()
    depthNormalIdPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPass.setJitter(true)
    depthNormalIdPass.setClearColor(0x000000, 1)
    depthNormalIdPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalIdDynamic = new DepthNormalIdPass()
    depthPassNormalIdDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalIdDynamic.setClearColor(0x000000, 1)
    depthPassNormalIdDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new EdgesPass()
    edgesPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalIdPass.normalTexture)
    edgesPass.setTexture('tId', depthNormalIdPass.idTexture)
    edgesPass.options = {
      outlineThickness: options.outlineThickness,
      outlineDensity: options.outlineOpacity,
      outlineColor: options.outlineColor
    }

    const edgesPassDynamic = new EdgesPass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalIdDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalIdDynamic.normalTexture)
    edgesPassDynamic.setTexture('tId', depthPassNormalIdDynamic.idTexture)
    edgesPassDynamic.options = {
      outlineThickness: options.outlineThickness,
      outlineDensity: options.outlineOpacity,
      outlineColor: options.outlineColor
    }

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(depthPassNormalIdDynamic, edgesPassDynamic)
    this.progressiveStage.push(depthNormalIdPass, edgesPass, taaPass)

    this.passList = this.dynamicStage

    this.depthPass = depthNormalIdPass
    this.depthPassDynamic = depthPassNormalIdDynamic
    this.edgePass = edgesPass
    this.edgePassDynamic = edgesPassDynamic
    this.outputTexture = taaPass.outputTarget?.texture
    this.outputTextureDynamic = edgesPassDynamic.outputTarget?.texture
  }

  protected SRTPipeline(options: EdgesPipelineOptions) {
    const depthPass = new DepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new NormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassDynamic = new DepthPass()
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassDynamic.setClearColor(0x000000, 1)
    depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPassDynamic = new NormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassDynamic.setClearColor(0x000000, 1)
    normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new EdgesPass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)
    edgesPass.options = {
      outlineThickness: options.outlineThickness,
      outlineDensity: options.outlineOpacity,
      outlineColor: options.outlineColor
    }

    const edgesPassDynamic = new EdgesPass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)
    edgesPassDynamic.options = {
      outlineThickness: options.outlineThickness,
      outlineDensity: options.outlineOpacity,
      outlineColor: options.outlineColor
    }

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(depthPassDynamic, normalPassDynamic, edgesPassDynamic)
    this.progressiveStage.push(depthPass, normalPass, edgesPass, taaPass)

    this.passList = this.dynamicStage

    this.depthPass = depthPass
    this.depthPassDynamic = depthPassDynamic
    this.edgePass = edgesPass
    this.edgePassDynamic = edgesPassDynamic
    this.outputTexture = taaPass.outputTarget?.texture
    this.outputTextureDynamic = edgesPassDynamic.outputTarget?.texture
  }
}
