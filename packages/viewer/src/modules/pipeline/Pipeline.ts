import { DoubleSide, Plane, Side, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import Batcher from '../batching/Batcher'
import SpeckleRenderer from '../SpeckleRenderer'
import { ApplySAOPass } from './ApplyAOPass'
import { CopyOutputPass } from './CopyOutputPass'
import { DepthPass, DepthSize, DepthType } from './DepthPass'
import { NormalsPass } from './NormalsPass'
import {
  DefaultDynamicAOPassParams,
  DynamicSAOPass,
  DynamicAOOutputType,
  type DynamicAOPassParams,
  NormalsType
} from './DynamicAOPass'
import {
  DefaultStaticAoPassParams,
  StaticAOPass,
  type StaticAoPassParams
} from './StaticAOPass'
import { BaseSpecklePass, RenderType, type SpecklePass } from './SpecklePass'
import { ColorPass } from './ColorPass'
import { StencilPass } from './StencilPass'
import { StencilMaskPass } from './StencilMaskPass'
import { OverlayPass } from './OverlayPass'
import { ObjectLayers } from '../../IViewer'
import type { BatchUpdateRange } from '../batching/Batch'

export enum PipelineOutputType {
  DEPTH_RGBA = 0,
  DEPTH = 1,
  COLOR = 2,
  GEOMETRY_NORMALS = 3,
  RECONSTRUCTED_NORMALS = 4,
  DYNAMIC_AO = 5,
  DYNAMIC_AO_BLURED = 6,
  PROGRESSIVE_AO = 7,
  FINAL = 8
}

export interface PipelineOptions {
  pipelineOutput: PipelineOutputType
  accumulationFrames: number
  dynamicAoEnabled: boolean
  dynamicAoParams: DynamicAOPassParams
  staticAoEnabled: boolean
  staticAoParams: StaticAoPassParams
  depthSide: Side
}

export const DefaultPipelineOptions: PipelineOptions = {
  pipelineOutput: PipelineOutputType.FINAL,
  accumulationFrames: 16,
  dynamicAoEnabled: true,
  dynamicAoParams: DefaultDynamicAOPassParams,
  staticAoEnabled: true,
  staticAoParams: DefaultStaticAoPassParams,
  depthSide: DoubleSide
}

export class Pipeline {
  private _renderer: WebGLRenderer
  private _batcher: Batcher
  private _pipelineOptions: PipelineOptions = Object.assign({}, DefaultPipelineOptions)
  private _composer: EffectComposer

  private depthPass: DepthPass
  private normalsPass: NormalsPass
  private stencilPass: StencilPass
  private renderPass: ColorPass
  private stencilMaskPass: StencilMaskPass
  private dynamicAoPass: DynamicSAOPass
  private applySaoPass: ApplySAOPass
  private copyOutputPass: CopyOutputPass
  private staticAoPass: StaticAOPass
  private overlayPass: OverlayPass

  private drawingSize: Vector2 = new Vector2()
  private _renderType: RenderType = RenderType.NORMAL
  private accumulationFrame = 0

  private onBeforePipelineRender: (() => void) | null = null
  private onAfterPipelineRender: (() => void) | null = null

  public set pipelineOptions(options: Partial<PipelineOptions>) {
    Object.assign(this._pipelineOptions, options)
    this.dynamicAoPass.setParams(options.dynamicAoParams)
    this.staticAoPass.setParams(options.staticAoParams)
    this.accumulationFrame = 0
    if (options.depthSide !== undefined) this.depthPass.depthSide = options.depthSide
    if (options.accumulationFrames !== undefined) {
      this.applySaoPass.setAccumulationFrames(options.accumulationFrames)
      this.staticAoPass.setAccumulationFrames(options.accumulationFrames)
    }
    if (options.pipelineOutput !== undefined)
      this.pipelineOutput = options.pipelineOutput
  }

  public get pipelineOptions(): PipelineOptions {
    return JSON.parse(JSON.stringify(this._pipelineOptions))
  }

  public set pipelineOutput(outputType: PipelineOutputType) {
    let pipeline: Array<SpecklePass> = []
    this.clearPipeline()
    switch (outputType) {
      case PipelineOutputType.FINAL:
        pipeline = this.getDefaultPipeline()
        this.depthPass.depthSize = DepthSize.FULL
        this.applySaoPass.setTexture('tDiffuse', this.staticAoPass.outputTexture)
        this.applySaoPass.setTexture('tDiffuseInterp', this.dynamicAoPass.outputTexture)
        break

      case PipelineOutputType.DEPTH_RGBA:
        pipeline.push(this.depthPass)
        pipeline.push(this.copyOutputPass)
        this.depthPass.depthSize = DepthSize.FULL
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH_RGBA)
        break

      case PipelineOutputType.DEPTH:
        pipeline.push(this.depthPass)
        pipeline.push(this.copyOutputPass)
        this.depthPass.depthSize = DepthSize.FULL
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH)
        break

      case PipelineOutputType.COLOR:
        pipeline.push(this.renderPass)
        break

      case PipelineOutputType.GEOMETRY_NORMALS:
        pipeline.push(this.normalsPass)
        pipeline.push(this.copyOutputPass)
        this.normalsPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.normalsPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.GEOMETRY_NORMALS)
        break

      case PipelineOutputType.RECONSTRUCTED_NORMALS:
        pipeline.push(this.depthPass)
        pipeline.push(this.dynamicAoPass)
        pipeline.push(this.copyOutputPass)
        this.dynamicAoPass.enabled = true
        this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
        this.depthPass.depthSize = DepthSize.HALF
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.RECONSTRUCTED_NORMALS)
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.GEOMETRY_NORMALS)
        break

      case PipelineOutputType.DYNAMIC_AO:
        pipeline.push(this.depthPass)
        pipeline.push(this.normalsPass)
        pipeline.push(this.dynamicAoPass)
        pipeline.push(this.copyOutputPass)
        this.normalsPass.enabled =
          this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
            ? true
            : false
        this.dynamicAoPass.enabled = true
        this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.COLOR)
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.AO)
        break

      case PipelineOutputType.DYNAMIC_AO_BLURED:
        pipeline.push(this.depthPass)
        pipeline.push(this.normalsPass)
        pipeline.push(this.dynamicAoPass)
        pipeline.push(this.copyOutputPass)
        this.normalsPass.enabled =
          this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
            ? true
            : false
        this.dynamicAoPass.enabled = true
        this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
        this.depthPass.depthSize = DepthSize.HALF
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.COLOR)
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.AO_BLURRED)
        break

      case PipelineOutputType.PROGRESSIVE_AO:
        pipeline.push(this.depthPass)
        // pipeline.push(this.normalsPass)
        pipeline.push(this.dynamicAoPass)
        pipeline.push(this.staticAoPass)
        pipeline.push(this.copyOutputPass)
        this.depthPass.depthType = DepthType.LINEAR_DEPTH
        this.depthPass.depthSize = DepthSize.FULL
        this.copyOutputPass.setTexture('tDiffuse', this.staticAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.COLOR)
        break
      default:
        break
    }
    this.setPipeline(pipeline)
  }

  public get needsAccumulation() {
    return (
      this._renderType === RenderType.ACCUMULATION &&
      this.accumulationFrame < this._pipelineOptions.accumulationFrames
    )
  }

  public get renderType() {
    return this._renderType
  }

  public get composer() {
    return this._composer
  }

  public constructor(renderer: WebGLRenderer, batcher: Batcher) {
    this._renderer = renderer
    this._batcher = batcher
    this._composer = new EffectComposer(renderer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._composer as any).readBuffer = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._composer as any).writeBuffer = null
  }

  public configure() {
    this.depthPass = new DepthPass()
    this.normalsPass = new NormalsPass()
    this.dynamicAoPass = new DynamicSAOPass()
    this.stencilPass = new StencilPass()
    this.renderPass = new ColorPass()
    this.stencilMaskPass = new StencilMaskPass()
    this.applySaoPass = new ApplySAOPass()
    this.staticAoPass = new StaticAOPass()
    this.overlayPass = new OverlayPass()

    this.copyOutputPass = new CopyOutputPass()
    this.copyOutputPass.renderToScreen = true

    this.depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    this.normalsPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    this.stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    this.renderPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    this.stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    this.overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])
    let restoreVisibility: Record<string, BatchUpdateRange>,
      opaque: Record<string, BatchUpdateRange>,
      stencil: Record<string, BatchUpdateRange>,
      depth: Record<string, BatchUpdateRange>

    this.onBeforePipelineRender = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      opaque = this._batcher.getOpaque()
      stencil = this._batcher.getStencil()
      depth = this._batcher.getDepth()
    }

    this.onAfterPipelineRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
    }

    this.depthPass.onBeforeRender = () => {
      this._batcher.applyVisibility(depth)
      this._batcher.overrideMaterial(depth, this.depthPass.material)
    }
    this.depthPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
      this._batcher.restoreMaterial(depth)
    }

    this.normalsPass.onBeforeRender = () => {
      this._batcher.applyVisibility(opaque)
      this._batcher.overrideMaterial(opaque, this.normalsPass.material)
    }
    this.normalsPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
      this._batcher.restoreMaterial(restoreVisibility)
    }

    this.stencilPass.onBeforeRender = () => {
      this._batcher.applyVisibility(stencil)
      this._batcher.overrideMaterial(stencil, this.stencilPass.material)
    }
    this.stencilPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
      this._batcher.restoreMaterial(stencil)
    }

    this.stencilMaskPass.onBeforeRender = () => {
      this._batcher.applyVisibility(stencil)
      this._batcher.overrideMaterial(stencil, this.stencilMaskPass.material)
    }
    this.stencilMaskPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
      this._batcher.restoreMaterial(stencil)
    }

    this.renderPass.onBeforeRenderOpauqe = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      const opaque = this._batcher.getOpaque()
      this._batcher.applyVisibility(opaque)
    }

    this.renderPass.onBeforeRenderTransparent = () => {
      const transparent = this._batcher.getTransparent()
      this._batcher.applyVisibility(transparent)
    }

    this.renderPass.onAfterRenderTransparent = () => {
      this._batcher.applyVisibility(restoreVisibility)
    }

    this.setPipeline(this.getDefaultPipeline())
  }

  private getDefaultPipeline(): Array<SpecklePass> {
    this.renderPass.renderToScreen = true
    this.normalsPass.enabled =
      this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
        ? true
        : false

    this.dynamicAoPass.setOutputType(
      this._pipelineOptions.dynamicAoParams.blurEnabled
        ? DynamicAOOutputType.AO_BLURRED
        : DynamicAOOutputType.AO
    )
    this.applySaoPass.renderToScreen = true

    this.dynamicAoPass.setTexture('tDepth', this.depthPass.outputTextureHalf)
    this.dynamicAoPass.setTexture('tNormal', this.normalsPass.outputTexture)
    this.applySaoPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
    this.applySaoPass.setTexture('tDiffuseInterp', this.dynamicAoPass.outputTexture)
    this.staticAoPass.setTexture('tDepth', this.depthPass.outputTexture)
    this.staticAoPass.setTexture('tNormal', this.normalsPass.outputTexture)

    const pipeline = []
    pipeline.push(this.depthPass)
    pipeline.push(this.normalsPass)
    pipeline.push(this.dynamicAoPass)
    pipeline.push(this.staticAoPass)
    pipeline.push(this.stencilPass)
    pipeline.push(this.renderPass)
    pipeline.push(this.stencilMaskPass)
    pipeline.push(this.applySaoPass)
    pipeline.push(this.overlayPass)

    return pipeline
  }

  private clearPipeline() {
    while (this._composer.passes.length > 0) {
      this._composer.removePass(this._composer.passes[0])
    }
  }

  private setPipeline(pipeline: Array<SpecklePass>) {
    for (let k = 0; k < pipeline.length; k++) {
      this._composer.addPass(pipeline[k] as BaseSpecklePass)
    }
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.depthPass.setClippingPlanes(planes)
    this.stencilPass.setClippingPlanes(planes)
    this.stencilMaskPass.setClippingPlanes(planes)
  }

  public reset() {
    this.accumulationFrame = 0
    this.onStationaryEnd()
  }

  public update(renderer: SpeckleRenderer) {
    if (!renderer.scene || !renderer.renderingCamera) return

    this.stencilPass.update(renderer.scene, renderer.renderingCamera)
    this.renderPass.update(renderer.scene, renderer.renderingCamera)
    this.stencilMaskPass.update(renderer.scene, renderer.renderingCamera)
    this.depthPass.update(renderer.scene, renderer.renderingCamera)
    this.dynamicAoPass.update(renderer.scene, renderer.renderingCamera)
    this.normalsPass.update(renderer.scene, renderer.renderingCamera)
    this.staticAoPass.update(renderer.scene, renderer.renderingCamera)
    this.applySaoPass.update(renderer.scene, renderer.renderingCamera)
    this.overlayPass.update(renderer.scene, renderer.renderingCamera)

    this.staticAoPass.setFrameIndex(this.accumulationFrame)
    this.applySaoPass.setFrameIndex(this.accumulationFrame)
  }

  public render(): boolean {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return false

    if (this.onBeforePipelineRender) this.onBeforePipelineRender()

    let retVal = false
    this._renderer.clear(true)
    this._composer.render()

    if (this._renderType === RenderType.NORMAL) {
      if (this.accumulationFrame < this._pipelineOptions.accumulationFrames)
        this.onStationaryBegin()
    } else if (this._renderType === RenderType.ACCUMULATION) {
      this.accumulationFrame++
      retVal = this.needsAccumulation
      if (!retVal) this.onAccumulationComplete()
    }

    if (this.onAfterPipelineRender) this.onAfterPipelineRender()
    return retVal
  }

  public resize(width: number, height: number) {
    this._composer.setSize(width, height)
    this.accumulationFrame = 0
  }

  public onStationaryBegin() {
    this._renderType = RenderType.ACCUMULATION
    this.accumulationFrame = 0
    this.depthPass.enabled = true
    this.depthPass.depthType = DepthType.LINEAR_DEPTH
    this.depthPass.depthSize = DepthSize.FULL
    this.normalsPass.enabled = false
    this.dynamicAoPass.enabled = false
    this.renderPass.enabled = true
    this.applySaoPass.enabled = true
    this.staticAoPass.enabled = true
    this.applySaoPass.setTexture('tDiffuse', this.staticAoPass.outputTexture)
    this.applySaoPass.setTexture('tDiffuseInterp', this.dynamicAoPass.outputTexture)
    this.applySaoPass.setRenderType(this._renderType)
  }

  public onStationaryEnd() {
    this.accumulationFrame = 0
    this._renderType = RenderType.NORMAL
    this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
    this.depthPass.depthSize = DepthSize.HALF
    this.staticAoPass.enabled = false
    this.applySaoPass.enabled = true
    this.dynamicAoPass.enabled = true
    this.applySaoPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
    this.applySaoPass.setRenderType(this._renderType)
  }

  protected onAccumulationComplete() {
    this._renderType = RenderType.NORMAL
    this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
    this.depthPass.depthSize = DepthSize.HALF
    this.staticAoPass.enabled = false
    this.applySaoPass.enabled = true
    this.dynamicAoPass.enabled = true
    this.applySaoPass.setTexture('tDiffuse', this.staticAoPass.outputTexture)
    this.applySaoPass.setRenderType(this._renderType)
  }
}
