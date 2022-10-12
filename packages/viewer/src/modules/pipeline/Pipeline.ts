import { Camera, Plane, Scene, Texture, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import Batcher from '../batching/Batcher'
import { ApplySAOPass } from './ApplySAOPass'
import {
  DefaultSpeckleDynamicSAOPassParams,
  NormalsType,
  SpeckleDynamicSAOPass,
  SpeckleDynamicSAOPassParams
} from './SpeckleDynamicSAOPass'
import { SpeckleStaticAOGeneratePass } from './SpeckleStaticAOGeneratePass'

enum RenderType {
  NORMAL,
  ACCUMULATION
}
export interface SpecklePass {
  get displayName(): string
  get outputTexture(): Texture
}

export interface PipelineOptions {
  dynamicAoEnabled: boolean
  dynamicAoParams: SpeckleDynamicSAOPassParams
}

export const DefaultPipelineOptions: PipelineOptions = {
  dynamicAoEnabled: true,
  dynamicAoParams: DefaultSpeckleDynamicSAOPassParams
  // saoScaleOffset: 0,
  // saoNormalsRendering: NormalsType.ACCURATE,
  // minDistance: 0,
  // maxDistance: 0.008,
  // ssaoKernelRadius: 0.5,
  // progressiveAO: 0,
  // progressive: true
}

export class Pipeline {
  private _renderer: WebGLRenderer = null
  private _batcher: Batcher = null
  private _pipelineOptions: PipelineOptions = Object.assign({}, DefaultPipelineOptions)
  private composer: EffectComposer = null

  private renderPass: RenderPass = null
  private dynamicAoPass: SpeckleDynamicSAOPass = null
  private applySaoPass: ApplySAOPass = null
  private staticAOGenerationPass: SpeckleStaticAOGeneratePass = null

  private drawingSize: Vector2 = new Vector2()
  private _renderType: RenderType = RenderType.NORMAL
  private accumulationFrame = 0
  private readonly NUM_ACCUMULATION_FRAMES = 16
  private enableProgressive = true

  public set pipelineOptions(options: Partial<PipelineOptions>) {
    Object.assign(this._pipelineOptions, options)
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
    this.dynamicAoPass = new SpeckleDynamicSAOPass(
      scene,
      camera,
      this._batcher,
      false,
      NormalsType.IMPROVED
    )
    this.staticAOGenerationPass = new SpeckleStaticAOGeneratePass(this._batcher)
    this.staticAOGenerationPass.depthTexture =
      this.dynamicAoPass.depthRenderTarget.texture
    this.composer.addPass(this.dynamicAoPass)
    this.renderPass = new RenderPass(scene, camera)
    this.renderPass.renderToScreen = true
    // this.renderPass.enabled = false
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.staticAOGenerationPass)
    this.applySaoPass = new ApplySAOPass()
    this.applySaoPass.setAoTexture(this.dynamicAoPass.saoRenderTarget.texture)
    this.applySaoPass.renderToScreen = true
    this.composer.addPass(this.applySaoPass)
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.dynamicAoPass.depthMaterial.clippingPlanes = planes
    this.dynamicAoPass.normalMaterial.clippingPlanes = planes
  }

  public render(scene: Scene, camera: Camera): boolean {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return

    if (this._renderType === RenderType.NORMAL) {
      this._renderer.clear(true)
      this.applySaoPass.setAoTexture(this.dynamicAoPass.saoRenderTarget.texture)
      this.renderPass.scene = scene
      this.renderPass.camera = camera
      this.dynamicAoPass.scene = scene
      this.dynamicAoPass.camera = camera
      this.composer.render()
      return true
    } else if (this.enableProgressive) {
      this._renderer.clear(true)
      this.applySaoPass.setAoTexture(this.staticAOGenerationPass.outputTexture.texture)
      this.renderPass.scene = scene
      this.renderPass.camera = camera
      this.dynamicAoPass.scene = scene
      this.dynamicAoPass.camera = camera
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
