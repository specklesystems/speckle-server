import {
  LinearFilter,
  NoBlending,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { ProgressiveGPass } from './GPass.js'
import { speckleTemporalSupersamplingVert } from '../../materials/shaders/speckle-temporal-supersampling-vert.js'
import { speckleTemporalSupersamplingFrag } from '../../materials/shaders/speckle-temporal-supersampling-frag.js'

export class TAAPass extends ProgressiveGPass {
  private inputTex: Texture | undefined
  private historyTarget: WebGLRenderTarget
  private fsQuad: FullScreenQuad
  public outputToScreen = false

  private materialCopy: ShaderMaterial
  private reprojectionMaterial: ShaderMaterial

  constructor() {
    super()

    this._outputTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.historyTarget = new WebGLRenderTarget(256, 256, {
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

    this.reprojectionMaterial = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tLastFrame: { value: null },
        width: { value: 0 },
        height: { value: 0 }
      },
      transparent: true,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,

      vertexShader: speckleTemporalSupersamplingVert,
      fragmentShader: speckleTemporalSupersamplingFrag
    })
    this.reprojectionMaterial.needsUpdate = true

    this.fsQuad = new FullScreenQuad()
  }

  public get displayName(): string {
    return 'TAA'
  }

  public set inputTexture(texture: Texture | undefined) {
    this.inputTex = texture
  }

  public render(renderer: WebGLRenderer): boolean {
    if (this.frameIndex === 0) {
      renderer.setRenderTarget(this._outputTarget)
      renderer.clear()
      this.materialCopy.uniforms['tDiffuse'].value = this.inputTex
      this.materialCopy.needsUpdate = true
      this.fsQuad.material = this.materialCopy
      this.fsQuad.render(renderer)
    }

    renderer.setRenderTarget(this.historyTarget)
    renderer.clear()
    this.reprojectionMaterial.uniforms['tLastFrame'].value = this._outputTarget?.texture
    this.reprojectionMaterial.uniforms['tDiffuse'].value = this.inputTex
    this.reprojectionMaterial.needsUpdate = true
    this.fsQuad.material = this.reprojectionMaterial
    this.fsQuad.render(renderer)

    renderer.setRenderTarget(this._outputTarget)
    renderer.clear()
    this.materialCopy.uniforms['tDiffuse'].value = this.historyTarget.texture
    this.materialCopy.needsUpdate = true
    this.fsQuad.material = this.materialCopy
    this.fsQuad.render(renderer)

    if (this.outputToScreen) {
      renderer.setRenderTarget(null)
      this.materialCopy.uniforms['tDiffuse'].value = this._outputTarget?.texture
      this.materialCopy.needsUpdate = true
      this.fsQuad.material = this.materialCopy
      this.fsQuad.render(renderer)
    }

    return super.render(renderer)
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)
    this.historyTarget.setSize(width, height)
    this.reprojectionMaterial.uniforms['width'].value = width
    this.reprojectionMaterial.uniforms['height'].value = height
  }
}
