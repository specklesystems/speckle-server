import { BaseGPass } from '@speckle/viewer'
import {
  AdditiveBlending,
  type OrthographicCamera,
  type PerspectiveCamera,
  ShaderMaterial,
  Vector2,
  type WebGLRenderer
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { snowfallFrag } from './snowfallFrag'
import { snowfallVert } from './snowfallVert'

export class SnowFallPass extends BaseGPass {
  public snowfallMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad
  private lastFrameTime: number = 0
  private totalTime: number = 0

  public constructor() {
    super()

    this.snowfallMaterial = new ShaderMaterial({
      fragmentShader: snowfallFrag,
      vertexShader: snowfallVert,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vector2(512, 512) }
      }
    })
    this.snowfallMaterial.depthWrite = false
    this.snowfallMaterial.blending = AdditiveBlending
    this.snowfallMaterial.transparent = true

    this.fsQuad = new FullScreenQuad(this.snowfallMaterial)
  }

  public get displayName(): string {
    return 'SNOWFALL'
  }

  public update(_camera: PerspectiveCamera | OrthographicCamera) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = performance.now()
      return
    }
    const now = performance.now()
    this.totalTime += now - this.lastFrameTime
    this.lastFrameTime = now
    this.snowfallMaterial.uniforms['iTime'].value = this.totalTime / 1000
    this.snowfallMaterial.needsUpdate = true
  }

  public render(renderer: WebGLRenderer): boolean {
    if (this.onBeforeRender) this.onBeforeRender()

    this.fsQuad.render(renderer)
    if (this.onAfterRender) this.onAfterRender()
    return true
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)

    this.snowfallMaterial.uniforms['iResolution'].value.set(width, height)
    this.snowfallMaterial.needsUpdate = true
  }
}
