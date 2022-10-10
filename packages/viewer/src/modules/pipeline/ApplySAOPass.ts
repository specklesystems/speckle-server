import {
  AddEquation,
  CustomBlending,
  DstAlphaFactor,
  DstColorFactor,
  NoBlending,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  ZeroFactor
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

export class ApplySAOPass extends Pass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
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

    // this.materialCopy.blending = CustomBlending
    // this.materialCopy.blendSrc = OneFactor
    // this.materialCopy.blendDst = OneFactor
    // this.materialCopy.blendEquation = ReverseSubtractEquation
    // this.materialCopy.blendSrcAlpha = OneFactor
    // this.materialCopy.blendDstAlpha = OneFactor
    // this.materialCopy.blendEquationAlpha = AddEquation
    this.materialCopy.needsUpdate = true
    this.fsQuad = new FullScreenQuad(this.materialCopy)
  }

  public setAoTexture(texture: Texture) {
    this.materialCopy.uniforms['tDiffuse'].value = texture
    this.materialCopy.needsUpdate = true
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive*/) {
    writeBuffer
    readBuffer
    renderer.setRenderTarget(null)
    this.fsQuad.render(renderer)
  }
}
