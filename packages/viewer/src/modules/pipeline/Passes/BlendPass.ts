import {
  AddEquation,
  CustomBlending,
  DstAlphaFactor,
  DstColorFactor,
  NoBlending,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  ZeroFactor
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { PassOptions, ProgressiveGPass } from './GPass.js'
import { speckleApplyAoVert } from '../../materials/shaders/speckle-apply-ao-vert.js'
import { speckleApplyAoFrag } from '../../materials/shaders/speckle-apply-ao-frag.js'

export interface BlendPassOptions extends PassOptions {
  blendAO?: boolean
  blendEdges?: boolean
}

export const DefaultBlendPassOptions: Required<BlendPassOptions> = {
  blendAO: true,
  blendEdges: false
}

export class BlendPass extends ProgressiveGPass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial

  public _options: Required<BlendPassOptions> = Object.assign(
    {},
    DefaultBlendPassOptions
  )

  public set options(value: BlendPassOptions) {
    super.options = value
    this.materialCopy.defines['BLEND_AO'] = +this._options.blendAO
    this.materialCopy.defines['BLEND_EDGES'] = +this._options.blendEdges
    this.materialCopy.needsUpdate = true
  }

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      defines: {
        BLEND_AO: +this._options.blendAO,
        BLEND_EDGES: +this._options.blendEdges
      },
      uniforms: {
        tAo: { value: null },
        tEdges: { value: null }
      },
      vertexShader: speckleApplyAoVert,
      fragmentShader: speckleApplyAoFrag,
      blending: NoBlending
    })
    this.materialCopy.transparent = true
    this.materialCopy.depthTest = false
    this.materialCopy.depthWrite = false
    this.materialCopy.blending = CustomBlending
    this.materialCopy.blendSrc = DstColorFactor
    this.materialCopy.blendDst = ZeroFactor
    this.materialCopy.blendEquation = AddEquation
    this.materialCopy.blendSrcAlpha = DstAlphaFactor
    this.materialCopy.blendDstAlpha = ZeroFactor
    this.materialCopy.blendEquationAlpha = AddEquation

    this.materialCopy.needsUpdate = true
    this.fsQuad = new FullScreenQuad(this.materialCopy)
  }

  public setTexture(uName: string, texture: Texture | undefined) {
    this.materialCopy.uniforms[uName].value = texture
    this.materialCopy.needsUpdate = true
  }

  get displayName(): string {
    return 'BLEND'
  }

  public render(renderer: WebGLRenderer): boolean {
    renderer.setRenderTarget(this._outputTarget)
    this.fsQuad.render(renderer)

    return super.render(renderer)
  }
}
