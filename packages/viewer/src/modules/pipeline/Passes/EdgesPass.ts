import {
  LinearFilter,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderer
} from 'three'

import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { BaseGPass, PassOptions } from './GPass.js'
import { speckleEdgesGeneratorFrag } from '../../materials/shaders/speckle-edges-generator-frag.js'
import { speckleEdgesGeneratorVert } from '../../materials/shaders/speckle-edges-generator-vert.js'
import { Pipeline } from '../Pipelines/Pipeline.js'

export interface EdgePassOptions extends PassOptions {
  depthMultiplier?: number
  depthBias?: number
  normalMultiplier?: number
  normalBias?: number
  outlineThickness?: number
  outlineDensity?: number
  backgroundTexture?: Texture | null
  backgroundTextureIntensity: number
}

export const DefaultEdgePassOptions: Required<EdgePassOptions> = {
  depthMultiplier: 1,
  depthBias: 0.001,
  normalMultiplier: 1,
  normalBias: 15,
  outlineThickness: 1,
  outlineDensity: 0.75,
  backgroundTexture: null,
  backgroundTextureIntensity: 0
}

export class EdgePass extends BaseGPass {
  public edgesMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad

  public _options: Required<EdgePassOptions> = Object.assign({}, DefaultEdgePassOptions)

  public set options(value: EdgePassOptions) {
    super.options = value
    this.setBackground(
      this._options.backgroundTexture,
      this._options.backgroundTextureIntensity
    )
  }

  public constructor() {
    super()

    this._outputTarget = Pipeline.createRenderTarget({
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

        uDepthMultiplier: { value: this._options.depthMultiplier },
        uDepthBias: { value: this._options.depthBias },
        uNormalMultiplier: { value: this._options.normalMultiplier },
        uNormalBias: { value: this._options.normalBias },
        uOutlineThickness: { value: this._options.outlineThickness },
        uOutlineDensity: { value: this._options.outlineDensity },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() },

        tBackground: { value: null },
        tBackgroundIntensity: { value: this._options.backgroundTextureIntensity }
      }
    })
    this.edgesMaterial.depthWrite = false

    this.fsQuad = new FullScreenQuad(this.edgesMaterial)
  }

  public setTexture(uName: string, texture: Texture | undefined) {
    this.edgesMaterial.uniforms[uName].value = texture
    this.edgesMaterial.needsUpdate = true
  }

  protected setBackground(texture: Texture | null, intensity: number) {
    if (!texture) {
      delete this.edgesMaterial.defines['TEXTURE_BACKGROUND']
    } else {
      this.edgesMaterial.defines['TEXTURE_BACKGROUND'] = ''
      this.setTexture('tBackground', texture)
      this.edgesMaterial.uniforms.tBackgroundIntensity.value = intensity
    }
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
    if (this.onBeforeRender) this.onBeforeRender()

    renderer.setRenderTarget(this._outputTarget)

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
