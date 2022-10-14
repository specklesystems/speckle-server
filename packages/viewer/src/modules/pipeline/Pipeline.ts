import { Camera, Plane, Scene, Vector2, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import Batcher from '../batching/Batcher'
import SpeckleRenderer from '../SpeckleRenderer'
import { ApplySAOPass } from './ApplySAOPass'
import { CopyOutputPass } from './CopyOutputPass'
import { DepthPass } from './DepthPass'
import { NormalsPass } from './NormalsPass'
import {
  DefaultSpeckleDynamicSAOPassParams,
  DynamicSAOPass,
  DynamicAOOutputType,
  DynamicAOPassParams,
  NormalsType
} from './DynamicAOPass'
// import { SpecklePass } from './SpecklePass'
// import { SpeckleStaticAOGeneratePass } from './SpeckleStaticAOGeneratePass'

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
  dynamicAoEnabled: boolean
  dynamicAoParams: DynamicAOPassParams
}

export const DefaultPipelineOptions: PipelineOptions = {
  pipelineOutput: PipelineOutputType.FINAL,
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

  private depthPass: DepthPass = null
  private normalsPass: NormalsPass = null
  private renderPass: RenderPass = null
  private dynamicAoPass: DynamicSAOPass = null
  private applySaoPass: ApplySAOPass = null
  private copyOutputPass: CopyOutputPass = null

  private drawingSize: Vector2 = new Vector2()

  public set pipelineOptions(options: Partial<PipelineOptions>) {
    Object.assign(this._pipelineOptions, options)
    if (options.dynamicAoEnabled) {
      this.dynamicAoPass.enabled = true
      this.renderPass.enabled = true
      this.applySaoPass.enabled = true
      this.normalsPass.enabled =
        options.dynamicAoParams.normalsType === NormalsType.DEFAULT ? true : false
      this.depthPass.enabled = true
      this.copyOutputPass.enabled = false
    } else {
      this.depthPass.enabled = false
      this.dynamicAoPass.enabled = false
      this.applySaoPass.enabled = false
      this.copyOutputPass.enabled = false
      this.normalsPass.enabled = false
      this.renderPass.enabled = true
    }
    this.dynamicAoPass.setParams(options.dynamicAoParams)

    this.pipelineOutput = options.pipelineOutput
  }

  public set pipelineOutput(outputType: PipelineOutputType) {
    switch (outputType) {
      case PipelineOutputType.FINAL:
        this.dynamicAoPass.enabled = true
        this.renderPass.enabled = true
        this.applySaoPass.enabled = true
        this.normalsPass.enabled =
          this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
            ? true
            : false
        this.depthPass.enabled = true
        this.copyOutputPass.enabled = false
        this.dynamicAoPass.setOutputType(
          this._pipelineOptions.dynamicAoParams.blurEnabled
            ? DynamicAOOutputType.AO_BLURRED
            : DynamicAOOutputType.AO
        )
        break

      case PipelineOutputType.DEPTH_RGBA:
        this.dynamicAoPass.enabled = false
        this.renderPass.enabled = false
        this.applySaoPass.enabled = false
        this.normalsPass.enabled = false
        this.depthPass.enabled = true
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH_RGBA)
        break

      case PipelineOutputType.DEPTH:
        this.dynamicAoPass.enabled = false
        this.renderPass.enabled = false
        this.applySaoPass.enabled = false
        this.depthPass.enabled = true
        this.normalsPass.enabled = false
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.depthPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.DEPTH)
        break

      case PipelineOutputType.COLOR:
        this.depthPass.enabled = false
        this.dynamicAoPass.enabled = false
        this.applySaoPass.enabled = false
        this.copyOutputPass.enabled = false
        this.normalsPass.enabled = false
        this.renderPass.enabled = true
        break

      case PipelineOutputType.GEOMETRY_NORMALS:
        this.depthPass.enabled = false
        this.dynamicAoPass.enabled = false
        this.applySaoPass.enabled = false
        this.renderPass.enabled = false
        this.normalsPass.enabled = true
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.normalsPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.GEOMETRY_NORMALS)
        break

      case PipelineOutputType.RECONSTRUCTED_NORMALS:
        this.depthPass.enabled = true
        this.dynamicAoPass.enabled = true
        this.applySaoPass.enabled = false
        this.renderPass.enabled = false
        this.normalsPass.enabled = false
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.GEOMETRY_NORMALS)
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.RECONSTRUCTED_NORMALS)
        break

      case PipelineOutputType.DYNAMIC_AO:
        this.depthPass.enabled = true
        this.dynamicAoPass.enabled = true
        this.applySaoPass.enabled = false
        this.renderPass.enabled = false
        this.normalsPass.enabled =
          this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
            ? true
            : false
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.COLOR)
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.AO)
        break

      case PipelineOutputType.DYNAMIC_AO_BLURED:
        this.depthPass.enabled = true
        this.dynamicAoPass.enabled = true
        this.applySaoPass.enabled = false
        this.renderPass.enabled = false
        this.normalsPass.enabled =
          this._pipelineOptions.dynamicAoParams.normalsType === NormalsType.DEFAULT
            ? true
            : false
        this.copyOutputPass.enabled = true
        this.copyOutputPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)
        this.copyOutputPass.setOutputType(PipelineOutputType.COLOR)
        this.dynamicAoPass.setOutputType(DynamicAOOutputType.AO_BLURRED)
        break
      default:
        break
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
    this.depthPass = new DepthPass()
    this.normalsPass = new NormalsPass()
    this.normalsPass.enabled = false
    this.dynamicAoPass = new DynamicSAOPass()
    this.renderPass = new RenderPass(scene, camera)
    this.renderPass.renderToScreen = true
    this.applySaoPass = new ApplySAOPass()
    this.applySaoPass.renderToScreen = true
    this.copyOutputPass = new CopyOutputPass()
    this.copyOutputPass.renderToScreen = true
    this.copyOutputPass.enabled = false
    this.composer.addPass(this.depthPass)
    this.composer.addPass(this.normalsPass)
    this.composer.addPass(this.dynamicAoPass)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.applySaoPass)
    this.composer.addPass(this.copyOutputPass)

    this.dynamicAoPass.setTexture('tDepth', this.depthPass.outputTexture)
    this.dynamicAoPass.setTexture('tNormal', this.normalsPass.outputTexture)
    this.applySaoPass.setTexture('tDiffuse', this.dynamicAoPass.outputTexture)

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
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.depthPass.setClippingPlanes(planes)
  }

  public update(renderer: SpeckleRenderer) {
    this.depthPass.update(renderer.scene, renderer.camera)
    this.dynamicAoPass.update(renderer.scene, renderer.camera)
    this.normalsPass.update(renderer.scene, renderer.camera)
  }

  public render(): boolean {
    this._renderer.getDrawingBufferSize(this.drawingSize)
    if (this.drawingSize.length() === 0) return

    this._renderer.clear(true)
    this.composer.render()
    return true
  }

  public resize(width: number, height: number) {
    this.composer.setSize(width, height)
  }

  public onStationaryBegin() {
    // this.renderType = RenderType.ACCUMULATION
    // this.staticAOGenerationPass.enabled = true
    // this.accumulationFrame = 0
    console.warn('Starting stationary')
  }

  public onStationaryEnd() {
    // this.renderType = RenderType.NORMAL
    // this.staticAOGenerationPass.enabled = false
    console.warn('Ending stationary')
  }
}
