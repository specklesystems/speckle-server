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
  private materialCopy: ShaderMaterial

  constructor(srcSao: Texture) {
    super()
    this.materialCopy = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      blending: NoBlending
    })
    // this.materialCopy.transparent = true
    // this.materialCopy.depthTest = false
    // this.materialCopy.depthWrite = false
    // this.materialCopy.blending = CustomBlending
    // this.materialCopy.blendSrc = DstColorFactor
    // this.materialCopy.blendDst = ZeroFactor
    // this.materialCopy.blendEquation = AddEquation
    // this.materialCopy.blendSrcAlpha = DstAlphaFactor
    // this.materialCopy.blendDstAlpha = ZeroFactor
    // this.materialCopy.blendEquationAlpha = AddEquation
    this.materialCopy.uniforms['tDiffuse'].value = srcSao
    this.materialCopy.needsUpdate = true
    this.fsQuad = new FullScreenQuad(this.materialCopy)
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive*/) {
    writeBuffer
    readBuffer
    renderer.setRenderTarget(null)
    this.fsQuad.render(renderer)
  }
}
