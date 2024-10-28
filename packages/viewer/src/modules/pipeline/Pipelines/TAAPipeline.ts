import SpeckleRenderer from '../../SpeckleRenderer.js'
import { BlendPass } from '../Passes/BlendPass.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { OutputPass, InputType } from '../Passes/OutputPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { ProgressiveAOPass } from '../Passes/ProgressiveAOPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { Pipeline } from './Pipeline.js'
import { LinearFilter } from 'three'

export class TAAPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

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

    const opaqueColorPass = new GeometryPass()
    opaqueColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    opaqueColorPass.setVisibility(ObjectVisibility.OPAQUE)

    const transparentColorPass = new GeometryPass()
    transparentColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    transparentColorPass.setVisibility(ObjectVisibility.TRANSPARENT)

    const progressiveAOPass = new ProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.setClearColor(0xffffff, 1)

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: true, blendEdges: false }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const renderTarget = Pipeline.createRenderTarget({
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    const jitterOpaquePass = new GeometryPass()
    jitterOpaquePass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    jitterOpaquePass.setVisibility(ObjectVisibility.OPAQUE)
    jitterOpaquePass.setJitter(true)
    jitterOpaquePass.outputTarget = renderTarget

    const jitterTransparentPass = new GeometryPass()
    jitterTransparentPass.setLayers([
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
    jitterTransparentPass.outputTarget = renderTarget

    const taaPass = new TAAPass()
    taaPass.inputTexture = renderTarget.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const outputPass = new OutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)
    outputPass.options = { inputType: InputType.Color }

    const stencilPass = new StencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilPass.setClearColor(0x000000, 0)
    stencilPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL)

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const jitteredStencilPass = new StencilPass()
    jitteredStencilPass.setVisibility(ObjectVisibility.STENCIL)
    jitteredStencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    jitteredStencilPass.setClearColor(0x000000, 0)
    jitteredStencilPass.setClearFlags(
      ClearFlags.COLOR | ClearFlags.DEPTH | ClearFlags.STENCIL
    )
    jitteredStencilPass.outputTarget = renderTarget

    const jitteredStencilMaskPass = new StencilMaskPass()
    jitteredStencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    jitteredStencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    jitteredStencilMaskPass.setClearFlags(ClearFlags.DEPTH)
    jitteredStencilMaskPass.outputTarget = renderTarget

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS
    ])

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
