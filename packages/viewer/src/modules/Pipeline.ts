import { Camera, Scene, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SAOPass, SAOPassParams } from 'three/examples/jsm/postprocessing/SAOPass.js'

export interface PipelineOptions {
  saoEnabled?: boolean
  saoParams: Partial<SAOPassParams>
}

export class Pipeline {
  private _renderer: WebGLRenderer = null
  private _pipelineOptions: PipelineOptions = null
  private composer: EffectComposer = null
  private renderPass: RenderPass = null
  private saoPass: SAOPass = null

  public set pipelineOptions(options: PipelineOptions) {
    this._pipelineOptions = options
    if (this.saoPass) {
      Object.assign(this.saoPass.params, options.saoParams)
    }
  }

  public constructor(renderer: WebGLRenderer) {
    this._renderer = renderer
    this.composer = new EffectComposer(renderer)
  }

  public configure(scene: Scene, camera: Camera) {
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)
    this.saoPass = new SAOPass(scene, camera, false, true)
    this.composer.addPass(this.saoPass)
  }

  public render(scene: Scene, camera: Camera) {
    this.renderPass.scene = scene
    this.renderPass.camera = camera
    this.saoPass.scene = scene
    this.saoPass.camera = camera
    this.composer.render()
  }
}
