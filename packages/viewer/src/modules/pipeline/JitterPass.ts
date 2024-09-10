import {
  LinearFilter,
  NoBlending,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { BaseSpecklePass, type SpecklePass } from './SpecklePass.js'
import { JitterQuad } from '../objects/JitterQuad.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

export class JitterPass extends BaseSpecklePass implements SpecklePass {
  private inputTex: Texture
  private renderTarget: WebGLRenderTarget
  private fsQuad: JitterQuad
  private materialCopy: ShaderMaterial
  private jitterIndex: number = 0
  private jitterOffsets: number[][] = this.generateHaltonJiters(16)

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })

    this.materialCopy = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      blending: NoBlending
    })

    this.materialCopy.needsUpdate = true

    this.fsQuad = new JitterQuad(this.materialCopy)
  }

  public get displayName(): string {
    return 'JITTER'
  }

  public set inputTexture(texture: Texture) {
    this.inputTex = texture
  }

  public get outputTexture(): Texture {
    return this.renderTarget.texture
  }

  render(renderer: WebGLRenderer) {
    this.materialCopy.uniforms['tDiffuse'].value = this.inputTex

    renderer.setRenderTarget(this.renderTarget)
    const [jitterX, jitterY] = this.jitterOffsets[this.jitterIndex]
    this.fsQuad.camera.setViewOffset(
      this.inputTex.image.width,
      this.inputTex.image.height,
      jitterX,
      jitterY, // 0.0625 = 1 / 16
      this.inputTex.image.width,
      this.inputTex.image.height
    )

    // this.fsQuad.camera.projectionMatrix.elements[8] =
    //   jitterX / this.inputTex.image.width
    // this.fsQuad.camera.projectionMatrix.elements[9] =
    //   jitterY / this.inputTex.image.height
    this.fsQuad.render(renderer)
    // this.fsQuad.camera.updateProjectionMatrix()
    this.jitterIndex = (this.jitterIndex + 1) % this.jitterOffsets.length
    // console.log(this.fsQuad.camera.projectionMatrix.elements[8])
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
  }

  /**
   * Generate a number in the Halton Sequence at a given index. This is
   * shamelessly stolen from the pseudocode on the Wikipedia page
   *
   * @param base the base to use for the Halton Sequence
   * @param index the index into the sequence
   */
  haltonNumber(base: number, index: number) {
    let result = 0
    let f = 1
    while (index > 0) {
      f /= base
      result += f * (index % base)
      index = Math.floor(index / base)
    }

    return result
  }

  generateHaltonJiters(length: number) {
    const jitters = []

    for (let i = 1; i <= length; i++)
      jitters.push([
        (this.haltonNumber(2, i) - 0.5) * 2,
        (this.haltonNumber(3, i) - 0.5) * 2
      ])

    return jitters
  }
}
