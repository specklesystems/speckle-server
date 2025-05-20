import {
  Color,
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

export interface EdgesPassOptions extends PassOptions {
  depthMultiplier?: number
  depthBias?: number
  normalMultiplier?: number
  normalBias?: number
  outlineThickness?: number
  outlineOpacity?: number
  outlineColor?: number
  backgroundColor?: number
}

export const DefaultEdgesPassOptions: Required<EdgesPassOptions> = {
  depthMultiplier: 1,
  depthBias: 0.001,
  normalMultiplier: 1,
  normalBias: 15,
  outlineThickness: 1,
  outlineOpacity: 0.75,
  outlineColor: 0x323232,
  backgroundColor: 0xfffffff
}

export class EdgesPass extends BaseGPass {
  public edgesMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad

  public _options: Required<EdgesPassOptions> = Object.assign(
    {},
    DefaultEdgesPassOptions
  )

  public set options(value: EdgesPassOptions) {
    super.options = value
    this.edgesMaterial.uniforms.uDepthMultiplier.value =
      this._options.depthMultiplier ?? DefaultEdgesPassOptions.depthMultiplier
    this.edgesMaterial.uniforms.uDepthBias.value =
      this._options.depthBias ?? DefaultEdgesPassOptions.depthBias
    this.edgesMaterial.uniforms.uNormalMultiplier.value =
      this._options.normalMultiplier ?? DefaultEdgesPassOptions.normalMultiplier
    this.edgesMaterial.uniforms.uNormalBias.value =
      this._options.normalBias ?? DefaultEdgesPassOptions.normalBias
    this.edgesMaterial.uniforms.uOutlineThickness.value =
      this._options.outlineThickness ?? DefaultEdgesPassOptions.outlineThickness
    this.edgesMaterial.uniforms.uOutlineDensity.value =
      this._options.outlineOpacity ?? DefaultEdgesPassOptions.outlineOpacity
    this.edgesMaterial.uniforms.uOutlineColor.value = new Color(
      this._options.outlineColor ?? DefaultEdgesPassOptions.outlineColor
    )
    this.edgesMaterial.uniforms.uBackgroundColor.value = new Color(
      this._options.backgroundColor ?? DefaultEdgesPassOptions.backgroundColor
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
        tId: { value: null },
        size: { value: new Vector2(512, 512) },

        uDepthMultiplier: { value: this._options.depthMultiplier },
        uDepthBias: { value: this._options.depthBias },
        uNormalMultiplier: { value: this._options.normalMultiplier },
        uNormalBias: { value: this._options.normalBias },
        uOutlineThickness: { value: this._options.outlineThickness },
        uOutlineDensity: { value: this._options.outlineOpacity },
        uOutlineColor: { value: new Color(this._options.outlineColor) },
        uBackgroundColor: { value: new Color(this._options.backgroundColor) },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() }
      }
    })
    this.edgesMaterial.depthWrite = false

    this.fsQuad = new FullScreenQuad(this.edgesMaterial)
  }

  public setTexture(uName: string, texture: Texture | undefined) {
    this.edgesMaterial.uniforms[uName].value = texture
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
