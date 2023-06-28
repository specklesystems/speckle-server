import {
  AddEquation,
  Camera,
  CustomBlending,
  DstAlphaFactor,
  DstColorFactor,
  NoBlending,
  Scene,
  ShaderMaterial,
  Texture,
  ZeroFactor
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { speckleApplyAoFrag } from '../materials/shaders/speckle-apply-ao-frag'
import { speckleApplyAoVert } from '../materials/shaders/speckle-apply-ao-vert'
import { Pipeline, RenderType } from './Pipeline'
import {
  InputColorTextureUniform,
  InputColorInterpolateTextureUniform,
  SpeckleProgressivePass
} from './SpecklePass'

export class ApplySAOPass extends Pass implements SpeckleProgressivePass {
  private fsQuad: FullScreenQuad
  public materialCopy: ShaderMaterial
  private frameIndex = 0

  constructor() {
    super()
    this.materialCopy = new ShaderMaterial({
      defines: {
        ACCUMULATE: 0
      },
      uniforms: {
        tDiffuse: { value: null },
        tDiffuseInterp: { value: null },
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

  public setTexture(
    uName: InputColorTextureUniform | InputColorInterpolateTextureUniform,
    texture: Texture
  ) {
    this.materialCopy.uniforms[uName].value = texture
    this.materialCopy.needsUpdate = true
  }

  get displayName(): string {
    return 'APPLYSAO'
  }

  get outputTexture(): Texture {
    return null
  }

  setParams(params: unknown) {
    params
  }

  setFrameIndex(index: number) {
    this.frameIndex = index
  }

  setRenderType(type: RenderType) {
    if (type === RenderType.NORMAL) {
      this.materialCopy.defines['ACCUMULATE'] = 0
    } else {
      this.materialCopy.defines['ACCUMULATE'] = 1
      this.frameIndex = 0
    }
    this.materialCopy.needsUpdate = true
  }

  public update(scene: Scene, camera: Camera) {
    scene
    camera
    this.materialCopy.defines['NUM_FRAMES'] = Pipeline.ACCUMULATE_FRAMES
    this.materialCopy.uniforms['frameIndex'].value = this.frameIndex
    this.materialCopy.needsUpdate = true
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
