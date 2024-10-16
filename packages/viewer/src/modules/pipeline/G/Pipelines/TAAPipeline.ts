import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GBlendPass } from '../GBlendPass.js'
import { GColorPass } from '../GColorPass.js'
import { GDepthPass, DepthType } from '../GDepthPass.js'
import { GNormalsPass } from '../GNormalPass.js'
import { GOutputPass, InputType } from '../GOutputPass.js'
import { ClearFlags, ObjectVisibility } from '../GPass.js'
import { GProgressiveAOPass } from '../GProgressiveAOPass.js'
import { GTAAPass } from '../GTAAPass.js'
import { ObjectLayers } from '../../../../IViewer.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GStencilPass } from '../GStencilPass.js'
import { GStencilMaskPass } from '../GStencilMaskPass.js'

export class TAAPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.depthType = DepthType.LINEAR_DEPTH
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new GNormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

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
    progressiveAOPass.setClearColor(0xffffff, 1)

    const blendPass = new GBlendPass()
    blendPass.setTexture('tDiffuse', progressiveAOPass.outputTarget?.texture)
    blendPass.setTexture('tEdges', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const jitterOpaquePass = new GColorPass()
    jitterOpaquePass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    jitterOpaquePass.setVisibility(ObjectVisibility.OPAQUE)
    jitterOpaquePass.setJitter(true)

    const jitterTransparentPass = new GColorPass()
    jitterTransparentPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    jitterTransparentPass.setVisibility(ObjectVisibility.TRANSPARENT)
    jitterTransparentPass.setJitter(true)
    jitterTransparentPass.outputTarget = jitterOpaquePass.outputTarget

    const taaPass = new GTAAPass()
    taaPass.inputTexture = jitterTransparentPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const outputPass = new GOutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)
    outputPass.setInputType(InputType.Color)

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilPass.setClearColor(0x000000, 0)
    stencilPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL)

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const jitteredStencilPass = new GStencilPass()
    jitteredStencilPass.setVisibility(ObjectVisibility.STENCIL)
    jitteredStencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    jitteredStencilPass.setClearColor(0x000000, 0)
    jitteredStencilPass.setClearFlags(
      ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL
    )
    jitteredStencilPass.outputTarget = jitterOpaquePass.outputTarget

    const jitteredStencilMaskPass = new GStencilMaskPass()
    jitteredStencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    jitteredStencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    jitteredStencilMaskPass.setClearFlags(ClearFlags.DEPTH)
    jitteredStencilMaskPass.outputTarget = jitterOpaquePass.outputTarget

    const overlayPass = new GColorPass()
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])
    overlayPass.outputTarget = null

    this.dynamicStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      jitteredStencilPass,
      jitterOpaquePass,
      jitterTransparentPass,
      jitteredStencilMaskPass,
      taaPass,
      outputPass,
      progressiveAOPass,
      blendPass,
      overlayPass
    )
    this.passthroughStage.push(outputPass, blendPass, overlayPass)

    this.passList = this.dynamicStage
  }

  public render(): boolean {
    /** The TAA pipeline cannot be soft reset currently, so we hard reset it instead as a temporary mmeasure */
    const isPassthrough = this.passList === this.passthroughStage
    const ret = super.render()
    if (isPassthrough) {
      this.reset()
      return true
    }
    return ret
  }
}
