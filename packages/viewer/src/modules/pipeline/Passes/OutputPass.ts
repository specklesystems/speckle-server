import { ShaderMaterial, Texture, UniformsUtils, WebGLRenderer } from 'three'
import { BaseGPass, PassOptions } from './GPass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { speckleCopyOutputVert } from '../../materials/shaders/speckle-copy-output-vert.js'
import { speckleCopyOutputFrag } from '../../materials/shaders/speckle-copy-output-frag.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

export enum InputType {
  Color = 0,
  PackedDepth = 1,
  Normals = 2,
  Passthrough = 3
}

export interface OutputPassOptions extends PassOptions {
  inputType?: InputType
}

export const DefaultOutputPassOptions: Required<OutputPassOptions> = {
  inputType: InputType.Passthrough
}

export class OutputPass extends BaseGPass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial

  public _options: Required<OutputPassOptions> = Object.assign(
    {},
    DefaultOutputPassOptions
  )

  public set options(value: OutputPassOptions) {
    super.options = value
    this.setInputType(this._options.inputType)
  }

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      defines: {
        INPUT_TYPE: this._options.inputType
      },
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: speckleCopyOutputVert,
      fragmentShader: speckleCopyOutputFrag,
      transparent: false
    })
    this.materialCopy.depthWrite = false
    this.materialCopy.needsUpdate = true
    this.fsQuad = new FullScreenQuad(this.materialCopy)
  }

  protected setInputType(type: InputType) {
    this.materialCopy.defines['INPUT_TYPE'] = type
    this.materialCopy.needsUpdate = true
  }

  public setTexture(uName: string, texture: Texture | undefined) {
    this.materialCopy.uniforms[uName].value = texture
    this.materialCopy.needsUpdate = true
  }

  get displayName(): string {
    return 'OUTPUT'
  }

  public render(renderer: WebGLRenderer): boolean {
    renderer.setRenderTarget(this._outputTarget)
    this.fsQuad.render(renderer)

    return false
  }
}
