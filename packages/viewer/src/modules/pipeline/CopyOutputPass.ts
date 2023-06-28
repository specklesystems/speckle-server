import { NoBlending, ShaderMaterial, Texture, UniformsUtils } from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { speckleCopyOutputFrag } from '../materials/shaders/speckle-copy-output-frag'
import { speckleCopyOutputVert } from '../materials/shaders/speckle-copy-output-vert'
import { PipelineOutputType } from './Pipeline'
import { InputColorTextureUniform, SpecklePass } from './SpecklePass'

export class CopyOutputPass extends Pass implements SpecklePass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      defines: {
        INPUT_TYPE: 0
      },
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: speckleCopyOutputVert,
      fragmentShader: speckleCopyOutputFrag,
      blending: NoBlending
    })

    this.materialCopy.needsUpdate = true
    this.fsQuad = new FullScreenQuad(this.materialCopy)
  }

  public setOutputType(type: PipelineOutputType) {
    this.materialCopy.defines['OUTPUT_TYPE'] = type
    this.materialCopy.needsUpdate = true
  }

  public setTexture(uName: InputColorTextureUniform, texture: Texture) {
    this.materialCopy.uniforms[uName].value = texture
    this.materialCopy.needsUpdate = true
  }

  get displayName(): string {
    return 'COPY-OUTPUT'
  }

  get outputTexture(): Texture {
    return null
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive*/) {
    writeBuffer
    readBuffer
    renderer.setRenderTarget(null)
    const rendereAutoClear = renderer.autoClear
    renderer.autoClear = false
    this.fsQuad.render(renderer)
    renderer.autoClear = rendereAutoClear
  }
}
