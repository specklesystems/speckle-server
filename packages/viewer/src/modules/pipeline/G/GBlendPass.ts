import {
  AddEquation,
  CustomBlending,
  DstAlphaFactor,
  DstColorFactor,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  ZeroFactor
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { ProgressiveGPass } from './GPass.js'
import { speckleApplyAoVert } from '../../materials/shaders/speckle-apply-ao-vert.js'
import { speckleApplyAoFrag } from '../../materials/shaders/speckle-apply-ao-frag.js'

export class GBlendPass extends ProgressiveGPass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      defines: {
        ACCUMULATE: 0,
        PASSTHROUGH: 1
      },
      uniforms: {
        tDiffuse: { value: null },
        tEdges: { value: null },
        frameIndex: { value: 0 }
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

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    camera
    this.materialCopy.defines['NUM_FRAMES'] = this.accumulationFrames
    this.materialCopy.uniforms['frameIndex'].value = this.frameIndex
    this.materialCopy.needsUpdate = true
  }

  public render(renderer: WebGLRenderer): boolean {
    renderer.setRenderTarget(this._outputTarget)
    this.fsQuad.render(renderer)

    return super.render(renderer)
  }
}
