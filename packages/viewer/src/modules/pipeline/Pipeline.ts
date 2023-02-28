import { Plane, Vector2, WebGLRenderer } from 'three'
import {
  EffectComposer,
  Pass
} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import Batcher from '../batching/Batcher'
import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'
import { ApplySAOPass } from './ApplyAOPass'
import { CopyOutputPass } from './CopyOutputPass'
import { DepthPass, DepthSize, DepthType } from './DepthPass'
import { NormalsPass } from './NormalsPass'
import {
  DefaultDynamicAOPassParams,
  DynamicSAOPass,
  DynamicAOOutputType,
  DynamicAOPassParams,
  NormalsType
} from './DynamicAOPass'
import {
  DefaultStaticAoPassParams,
  StaticAOPass,
  StaticAoPassParams
} from './StaticAOPass'
import { SpecklePass } from './SpecklePass'
import { ColorPass } from './ColorPass'
import { StencilPass } from './StencilPass'
import { StencilMaskPass } from './StencilMaskPass'

export enum RenderType {
  NORMAL,
  ACCUMULATION
}

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
}

export const DefaultPipelineOptions: PipelineOptions = {
  pipelineOutput: PipelineOutputType.FINAL,
  accumulationFrames: 16,
  dynamicAoEnabled: true,
  dynamicAoParams: DefaultDynamicAOPassParams,
  staticAoEnabled: true,
  staticAoParams: DefaultStaticAoPassParams
}

export class Pipeline {
  public static ACCUMULATE_FRAMES = 16

  private _renderer: WebGLRenderer = null
  private _batcher: Batcher = null
  private _pipelineOptions: PipelineOptions = Object.assign({}, DefaultPipelineOptions)
  private _needsProgressive = false
  private _resetFrame = false
  private composer: EffectComposer = null

  private depthPass: DepthPass = null
  private normalsPass: NormalsPass = null
  private stencilPass: StencilPass = null
  private renderPass: ColorPass = null
  private stencilMaskPass: StencilMaskPass = null
  private dynamicAoPass: DynamicSAOPass = null
  private applySaoPass: ApplySAOPass = null
  private copyOutputPass: CopyOutputPass = null
  private staticAoPass: StaticAOPass = null

  private drawingSize: Vector2 = new Vector2()
  private _renderType: RenderType = RenderType.NORMAL
  private accumulationFrame = 0

  public set pipelineOptions(options: Partial<PipelineOptions>) {
    Object.assign(this._pipelineOptions, options)
    this.dynamicAoPass.setParams(options.dynamicAoParams)
    this.staticAoPass.setParams(options.staticAoParams)
    this.accumulationFrame = 0
    Pipeline.ACCUMULATE_FRAMES = options.accumulationFrames

    this.pipelineOutput = options.pipelineOutput
  }

  public set pipelineOutput(outputType: PipelineOutputType) {
    let pipeline = []
    this.clearPipeline()
    switch (outputType) {
      case PipelineOutputType.FINAL:
        pipeline = this.getDefaultPipeline()
        this.depthPass.depthSize = DepthSize.FULL
        this.applySaoPass.setTexture('tDiffuse', this.staticAoPass.outputTexture)
        this.applySaoPass.setTexture('tDiffuseInterp', this.dynamicAoPass.outputTexture)
        this.needsProgressive = true
        break

      case PipelineOutputType.DEPTH_RGBA:
        pipeline.push(this.depthPass)
        pipeline.push(this.copyOutputPass)
        this.depthPass.depthSize = DepthSize.FULL
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH_RGBA)
        this.needsProgressive = false
        break

      case PipelineOutputType.DEPTH:
        pipeline.push(this.depthPass)
        pipeline.push(this.copyOutputPass)
        this.depthPass.depthSize = DepthSize.FULL
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH)
        this.needsProgressive = false
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
        this.needsProgressive = false
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
        this.needsProgressive = false
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
        this.needsProgressive = false
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
        this.needsProgressive = false
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
        this.needsProgressive = true
        break
      default:
        break
    }
    this.setPipeline(pipeline)
  }

  public set needsProgressive(value: boolean) {
    this._needsProgressive = value
    if (!value) this._renderType = RenderType.NORMAL
    if (value && this._renderType === RenderType.NORMAL)
      this._renderType = RenderType.ACCUMULATION
    this.accumulationFrame = 0
  }

  public get renderType() {
    return this._renderType
  }

  public constructor(renderer: WebGLRenderer, batcher: Batcher) {
    this._renderer = renderer
    this._batcher = batcher
    this.composer = new EffectComposer(renderer)
    this.composer.readBuffer = null
    this.composer.writeBuffer = null
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
      ObjectLayers.SHADOWCATCHER
    ])
    this.stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    let restoreVisibility
    this.depthPass.onBeforeRender = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      const opaque = this._batcher.getOpaque()
      this._batcher.applyVisibility(opaque)
    }
    this.depthPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
    }

    this.normalsPass.onBeforeRender = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      const opaque = this._batcher.getOpaque()
      this._batcher.applyVisibility(opaque)
    }
    this.normalsPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
    }

    this.stencilPass.onBeforeRender = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      const stencil = this._batcher.getStencil()
      this._batcher.applyVisibility(stencil)
    }
    this.stencilPass.onAfterRender = () => {
      this._batcher.applyVisibility(restoreVisibility)
    }

    this.stencilMaskPass.onBeforeRender = () => {
      restoreVisibility = this._batcher.saveVisiblity()
      const stencil = this._batcher.getStencil()
      this._batcher.applyVisibility(stencil)
    }
    this.stencilMaskPass.onAfterRender = () => {
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

    this.needsProgressive = true
    return pipeline
  }

  private clearPipeline() {
    while (this.composer.passes.length > 0) {
      this.composer.removePass(this.composer.passes[0])
    }
  }

  private setPipeline(pipeline: Array<SpecklePass>) {
    for (let k = 0; k < pipeline.length; k++) {
      this.composer.addPass(pipeline[k] as unknown as Pass)
    }
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.depthPass.setClippingPlanes(planes)
    this.stencilPass.setClippingPlanes(planes)
    this.stencilMaskPass.setClippingPlanes(planes)
  }

  public reset() {
    this._resetFrame = true
    this.onStationaryEnd()
  }

  public update(renderer: SpeckleRenderer) {
    this.stencilPass.update(renderer.scene, renderer.camera)
    this.renderPass.update(renderer.scene, renderer.camera)
    this.stencilMaskPass.update(renderer.scene, renderer.camera)
    this.depthPass.update(renderer.scene, renderer.camera)
    this.dynamicAoPass.update(renderer.scene, renderer.camera)
    this.normalsPass.update(renderer.scene, renderer.camera)
    this.staticAoPass.update(renderer.scene, renderer.camera)
    this.applySaoPass.update(renderer.scene, renderer.camera)

    this.staticAoPass.setFrameIndex(this.accumulationFrame)
    this.applySaoPass.setFrameIndex(this.accumulationFrame)
  }

  public render(): boolean {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return

    this._renderer.clear(true)
    if (this._renderType === RenderType.NORMAL) {
      this.composer.render()
      const ret = false || this._resetFrame
      if (this._resetFrame) {
        this._resetFrame = false
        this.onStationaryBegin()
      }
      return ret
    } else {
      // console.warn('Rendering accumulation frame -> ', this.accumulationFrame)
      this.composer.render()
      this.accumulationFrame++
      return this.accumulationFrame < Pipeline.ACCUMULATE_FRAMES
    }
  }

  public resize(width: number, height: number) {
    this.composer.setSize(width, height)
    this.accumulationFrame = 0
  }

  public onStationaryBegin() {
    if (!this._needsProgressive) return
    if (this._renderType === RenderType.ACCUMULATION) {
      this.accumulationFrame = 0
      return
    }
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
    // console.warn('Starting stationary')
  }

  public onStationaryEnd() {
    if (!this._needsProgressive) return
    if (this._renderType === RenderType.NORMAL) return
    this.accumulationFrame = 0
    this._renderType = RenderType.NORMAL
    this.depthPass.depthType = DepthType.PERSPECTIVE_DEPTH
    this.depthPass.depthSize = DepthSize.HALF
    this.staticAoPass.enabled = false
    this.applySaoPass.enabled = true
    this.dynamicAoPass.enabled = true
    this.applySaoPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
    this.applySaoPass.setRenderType(this._renderType)
    // console.warn('Ending stationary')
  }
}
