import { Camera, Plane, Scene, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SAOPassParams } from 'three/examples/jsm/postprocessing/SAOPass.js'
import Batcher from '../batching/Batcher'
import { ApplySAOPass } from './ApplySAOPass'
import { NormalsType, SpeckleSAOPass } from './SpeckleSAOPass'

export interface PipelineOptions {
  saoEnabled?: boolean
  saoParams?: Partial<SAOPassParams>
  saoScaleOffset?: number
  saoNormalsRendering?: NormalsType
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
  saoNormalsRendering: NormalsType.IMPROVED
}

export class Pipeline {
  private _renderer: WebGLRenderer = null
  private _batcher: Batcher = null
  private _pipelineOptions: PipelineOptions = {}
  private composer: EffectComposer = null
  private renderPass: RenderPass = null
  private saoPass: SpeckleSAOPass = null
  private applySaoPass: ApplySAOPass = null
  private drawingSize: Vector2 = new Vector2()

  public set pipelineOptions(options: PipelineOptions) {
    Object.assign(this._pipelineOptions, options)
    if (this.saoPass) {
      this.applySaoPass.enabled = this._pipelineOptions.saoEnabled
      Object.assign(this.saoPass.params, this._pipelineOptions.saoParams)
      this.saoPass.params.saoScale += this._pipelineOptions.saoScaleOffset
      this.saoPass.normalsRendering = this._pipelineOptions.saoNormalsRendering
    }
  }

  public constructor(renderer: WebGLRenderer, batcher: Batcher) {
    this._renderer = renderer
    this._batcher = batcher
    this.composer = new EffectComposer(renderer)
    this.composer.readBuffer = null
    this.composer.writeBuffer = null
  }

  public configure(scene: Scene, camera: Camera) {
    this.saoPass = new SpeckleSAOPass(
      scene,
      camera,
      this._batcher,
      false,
      NormalsType.IMPROVED
    )
    this.composer.addPass(this.saoPass)
    this.renderPass = new RenderPass(scene, camera)
    this.renderPass.renderToScreen = true
    this.composer.addPass(this.renderPass)
    this.applySaoPass = new ApplySAOPass(this.saoPass.saoRenderTarget.texture)
    this.applySaoPass.renderToScreen = true
    this.composer.addPass(this.applySaoPass)
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.saoPass.depthMaterial.clippingPlanes = planes
    this.saoPass.normalMaterial.clippingPlanes = planes
  }

  public render(scene: Scene, camera: Camera) {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return

    this.renderPass.scene = scene
    this.renderPass.camera = camera
    this.saoPass.scene = scene
    this.saoPass.camera = camera
    this.composer.render()
  }

  public resize(width: number, height: number) {
    this.composer.setSize(width, height)
  }
}
