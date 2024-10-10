import {
  HalfFloatType,
  LinearFilter,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'

import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { BaseGPass } from './GPass.js'
import { speckleEdgesGeneratorFrag } from '../../materials/shaders/speckle-edges-generator-frag.js'
import { speckleEdgesGeneratorVert } from '../../materials/shaders/speckle-edges-generator-vert.js'

export class GEdgePass extends BaseGPass {
  public edgesMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad

  public constructor() {
    super()

    this._outputTarget = new WebGLRenderTarget(256, 256, {
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })

    this.edgesMaterial = new ShaderMaterial({
      fragmentShader: speckleEdgesGeneratorFrag,
      vertexShader: speckleEdgesGeneratorVert,
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        size: { value: new Vector2(512, 512) },

        uDepthMultiplier: { value: 1 },
        uDepthBias: { value: 0.001 },
        uNormalMultiplier: { value: 1 },
        uNormalBias: { value: 15 },
        uOutlineThickness: { value: 1 },
        uOutlineDensity: { value: 0.75 },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() },

        tBackground: { value: null }
      }
    })

    this.fsQuad = new FullScreenQuad(this.edgesMaterial)
  }

  public setTexture(uName: string, texture: Texture | undefined) {
    this.edgesMaterial.uniforms[uName].value = texture
    this.edgesMaterial.needsUpdate = true
  }

  public setBackground(texture: Texture) {
    if (!texture) {
      delete this.edgesMaterial.defines['PAPER_BACKGROUND']
    } else this.edgesMaterial.defines['PAPER_BACKGROUND'] = ''

    this.edgesMaterial.uniforms.tBackground.value = texture
    this.edgesMaterial.needsUpdate = true
  }

  public get displayName(): string {
    return 'EDGES'
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    this.edgesMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.edgesMaterial.uniforms['cameraNear'].value = camera.near
    this.edgesMaterial.uniforms['cameraFar'].value = camera.far
  }

  public render(renderer: WebGLRenderer): boolean {
    renderer.setRenderTarget(this._outputTarget)

    renderer.setClearColor(0x000000)
    renderer.setClearAlpha(0.0)
    renderer.clear()

    if (this.onBeforeRender) this.onBeforeRender()
    this.fsQuad.render(renderer)
    if (this.onAfterRender) this.onAfterRender()
    return false
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)
    this.edgesMaterial.uniforms['size'].value.set(width, height)
    this.edgesMaterial.needsUpdate = true
  }
}
