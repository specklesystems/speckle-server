import { Camera, Plane, Scene, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SAOPassParams } from 'three/examples/jsm/postprocessing/SAOPass.js'
import Batcher from '../batching/Batcher'
import { ApplySAOPass } from './ApplySAOPass'
import { NormalsType, SpeckleDynamicSAOPass } from './SpeckleDynamicSAOPass'
import { SpeckleStaticAOGeneratePass } from './SpeckleStaticAOGeneratePass'

enum RenderType {
  NORMAL,
  ACCUMULATION
}

export interface PipelineOptions {
  saoEnabled?: boolean
  saoParams?: Partial<SAOPassParams>
  saoScaleOffset?: number
  saoNormalsRendering?: NormalsType
  minDistance?: number
  maxDistance?: number
  ssaoKernelRadius?: number
  progressiveAO?: number
  progressive?: boolean
}

export const DefaultPipelineOptions: PipelineOptions = {
  saoEnabled: true,
  saoParams: {
    saoBias: 0.15,
    saoIntensity: 1.25,
    saoScale: 434,
    saoKernelRadius: 10,
    saoMinResolution: 0,
    saoBlur: true,
    saoBlurRadius: 4,
    saoBlurStdDev: 4,
    saoBlurDepthCutoff: 0.0007
  },
  saoScaleOffset: 0,
  saoNormalsRendering: NormalsType.ACCURATE,
  minDistance: 0,
  maxDistance: 0.008,
  ssaoKernelRadius: 0.5,
  progressiveAO: 0,
  progressive: true
}

export class Pipeline {
  private _renderer: WebGLRenderer = null
  private _batcher: Batcher = null
  private _pipelineOptions: PipelineOptions = {}
  private composer: EffectComposer = null
  private renderPass: RenderPass = null
  private saoPass: SpeckleDynamicSAOPass = null
  private applySaoPass: ApplySAOPass = null
  private staticAOGenerationPass: SpeckleStaticAOGeneratePass = null
  private drawingSize: Vector2 = new Vector2()
  private _renderType: RenderType = RenderType.NORMAL
  private accumulationFrame = 0
  private readonly NUM_ACCUMULATION_FRAMES = 16
  private enableProgressive = true

  public set pipelineOptions(options: PipelineOptions) {
    Object.assign(this._pipelineOptions, options)
    if (this.saoPass) {
      this.applySaoPass.enabled = this._pipelineOptions.saoEnabled
      Object.assign(this.saoPass.params, this._pipelineOptions.saoParams)
      this.saoPass.params.saoScale += this._pipelineOptions.saoScaleOffset
      this.saoPass.normalsRendering = this._pipelineOptions.saoNormalsRendering
      if (
        this.staticAOGenerationPass.minDistance !== this._pipelineOptions.minDistance ||
        this.staticAOGenerationPass.maxDistance !== this._pipelineOptions.maxDistance
      )
        this.accumulationFrame = 0
      if (
        this._pipelineOptions.ssaoKernelRadius !== undefined &&
        this.staticAOGenerationPass.ssaoKernelRadius !==
          this._pipelineOptions.ssaoKernelRadius
      ) {
        this.accumulationFrame = 0
        this.staticAOGenerationPass.ssaoKernelRadius =
          this._pipelineOptions.ssaoKernelRadius
      }
      if (
        this._pipelineOptions.progressiveAO !== undefined &&
        this.staticAOGenerationPass.progressiveAO !==
          this._pipelineOptions.progressiveAO
      ) {
        this.accumulationFrame = 0
        this.staticAOGenerationPass.progressiveAO = this._pipelineOptions.progressiveAO
        this.staticAOGenerationPass.aoMaterial.defines['AO_ESTIMATOR'] =
          this._pipelineOptions.progressiveAO
        this.staticAOGenerationPass.aoMaterial.needsUpdate = true
      }
      this.staticAOGenerationPass.minDistance = this._pipelineOptions.minDistance
      this.staticAOGenerationPass.maxDistance = this._pipelineOptions.maxDistance
      if (
        this._pipelineOptions.saoParams.saoKernelRadius !== undefined &&
        this.staticAOGenerationPass.kernelRadius !==
          this._pipelineOptions.saoParams.saoKernelRadius
      ) {
        this.accumulationFrame = 0
        this.staticAOGenerationPass.kernelRadius =
          this._pipelineOptions.saoParams.saoKernelRadius
      }
      this.enableProgressive = this._pipelineOptions.progressive
    }
  }

  private set renderType(value: RenderType) {
    this._renderType = value
  }

  public constructor(renderer: WebGLRenderer, batcher: Batcher) {
    this._renderer = renderer
    this._batcher = batcher
    this.composer = new EffectComposer(renderer)
    this.composer.readBuffer = null
    this.composer.writeBuffer = null
  }

  public configure(scene: Scene, camera: Camera) {
    this.saoPass = new SpeckleDynamicSAOPass(
      scene,
      camera,
      this._batcher,
      false,
      NormalsType.IMPROVED
    )
    this.staticAOGenerationPass = new SpeckleStaticAOGeneratePass(this._batcher)
    this.staticAOGenerationPass.depthTexture = this.saoPass.depthRenderTarget.texture
    this.composer.addPass(this.saoPass)
    this.renderPass = new RenderPass(scene, camera)
    this.renderPass.renderToScreen = true
    // this.renderPass.enabled = false
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.staticAOGenerationPass)
    this.applySaoPass = new ApplySAOPass()
    this.applySaoPass.setAoTexture(this.saoPass.saoRenderTarget.texture)
    this.applySaoPass.renderToScreen = true
    this.composer.addPass(this.applySaoPass)
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.saoPass.depthMaterial.clippingPlanes = planes
    this.saoPass.normalMaterial.clippingPlanes = planes
  }

  public render(scene: Scene, camera: Camera): boolean {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return

    if (this._renderType === RenderType.NORMAL) {
      this._renderer.clear(true)
      this.applySaoPass.setAoTexture(this.saoPass.saoRenderTarget.texture)
      this.renderPass.scene = scene
      this.renderPass.camera = camera
      this.saoPass.scene = scene
      this.saoPass.camera = camera
      this.composer.render()
      return true
    } else if (this.enableProgressive) {
      this._renderer.clear(true)
      this.applySaoPass.setAoTexture(this.staticAOGenerationPass.outputTexture.texture)
      this.renderPass.scene = scene
      this.renderPass.camera = camera
      this.saoPass.scene = scene
      this.saoPass.camera = camera
      this.staticAOGenerationPass.update(camera, this.accumulationFrame)
      this.composer.render()
      this.accumulationFrame++
      console.warn('rendering stationary frame => ', this.accumulationFrame)
      return this.accumulationFrame < this.NUM_ACCUMULATION_FRAMES ? true : false
    }
  }

  public resize(width: number, height: number) {
    this.composer.setSize(width, height)
  }

  public onStationaryBegin() {
    this.renderType = RenderType.ACCUMULATION
    this.staticAOGenerationPass.enabled = true
    this.accumulationFrame = 0
    console.warn('Starting stationary')
  }

  public onStationaryEnd() {
    this.renderType = RenderType.NORMAL
    this.staticAOGenerationPass.enabled = false
    console.warn('Ending stationary')
  }
}
