import {
  AddEquation,
  Camera,
  Color,
  CustomBlending,
  Matrix4,
  NoBlending,
  OneFactor,
  OrthographicCamera,
  PerspectiveCamera,
  ReverseSubtractEquation,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'

import Batcher from '../batching/Batcher'
import { speckleStaticAoGenerateVert } from '../materials/shaders/speckle-static-ao-generate-vert'
import { speckleStaticAoGenerateFrag } from '../materials/shaders/speckle-static-ao-generate-frag'
import { speckleStaticAoAccumulateVert } from '../materials/shaders/speckle-static-ao-accumulate-vert'
import { speckleStaticAoAccumulateFrag } from '../materials/shaders/speckle-static-ao-accumulate-frag'
/**
 * SAO implementation inspired from bhouston previous SAO work
 */

export class SpeckleStaticAOGeneratePass extends Pass {
  private batcher: Batcher = null
  private aoMaterial: ShaderMaterial = null
  private accumulateMaterial: ShaderMaterial = null
  private _depthTexture: Texture
  private _normalTexture: Texture
  private _generationBuffer: WebGLRenderTarget
  private _accumulationBuffer: WebGLRenderTarget
  private fsQuad: FullScreenQuad
  private frameIndex = 0

  public set depthTexture(value: Texture) {
    this._depthTexture = value
    this.aoMaterial.uniforms['tDepth'].value = value
    this.aoMaterial.needsUpdate = true
  }

  public set normalTexture(value: Texture) {
    this._normalTexture = value
  }

  public get outputTexture() {
    return this._accumulationBuffer
  }

  constructor(batcher: Batcher) {
    super()

    this.batcher = batcher
    this._generationBuffer = new WebGLRenderTarget(256, 256)
    this._accumulationBuffer = new WebGLRenderTarget(256, 256)
    const aoDefines = {
      AO_ESTIMATOR: 0
    }

    this.aoMaterial = new ShaderMaterial({
      defines: aoDefines,
      fragmentShader: speckleStaticAoGenerateFrag,
      vertexShader: speckleStaticAoGenerateVert,
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        size: { value: new Vector2(512, 512) },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() },

        scale: { value: 1.0 },
        intensity: { value: 1 },
        bias: { value: 0 },

        minResolution: { value: 0.0 },
        kernelRadius: { value: 15.0 },
        randomSeed: { value: 0.0 },

        frameIndex: { value: 0 }
      }
    })

    this.aoMaterial.extensions.derivatives = true
    this.aoMaterial.uniforms['size'].value.set(256, 256)
    this.aoMaterial.blending = NoBlending

    this.accumulateMaterial = new ShaderMaterial({
      defines: {},
      fragmentShader: speckleStaticAoAccumulateFrag,
      vertexShader: speckleStaticAoAccumulateVert,
      uniforms: {
        tDiffuse: { value: null },
        opacity: { value: 1 }
      }
    })
    this.accumulateMaterial.uniforms['tDiffuse'].value = this._generationBuffer.texture
    this.accumulateMaterial.blending = CustomBlending
    this.accumulateMaterial.blendSrc = OneFactor
    this.accumulateMaterial.blendDst = OneFactor
    this.accumulateMaterial.blendEquation = ReverseSubtractEquation
    this.accumulateMaterial.blendSrcAlpha = OneFactor
    this.accumulateMaterial.blendDstAlpha = OneFactor
    this.accumulateMaterial.blendEquationAlpha = AddEquation

    this.fsQuad = new FullScreenQuad(this.aoMaterial)
  }

  public update(camera: Camera, frameIndex: number) {
    this.aoMaterial.uniforms['cameraNear'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.aoMaterial.uniforms['cameraFar'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.aoMaterial.uniforms['cameraInverseProjectionMatrix'].value.copy(
      camera.projectionMatrixInverse
    )
    this.aoMaterial.uniforms['cameraProjectionMatrix'].value.copy(
      camera.projectionMatrix
    )
    this.aoMaterial.uniforms['scale'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.aoMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.aoMaterial.uniforms['frameIndex'].value = frameIndex
    this.aoMaterial.needsUpdate = true
    this.frameIndex = frameIndex
  }

  public render(renderer, writeBuffer, readBuffer) {
    writeBuffer
    readBuffer

    // save original state
    const originalClearColor = new Color()
    renderer.getClearColor(originalClearColor)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    this.renderFrame(renderer)
    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(originalClearColor)
    renderer.setClearAlpha(originalClearAlpha)
  }

  private renderFrame(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this._generationBuffer)
    renderer.autoClear = false
    renderer.setClearColor(0x000000)
    renderer.setClearAlpha(1)
    renderer.clear()
    this.fsQuad.material = this.aoMaterial
    this.fsQuad.render(renderer)

    renderer.setRenderTarget(this._accumulationBuffer)
    if (this.frameIndex === 0) {
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1)
      renderer.clear()
    }
    this.fsQuad.material = this.accumulateMaterial
    this.fsQuad.render(renderer)
  }

  public setSize(width: number, height: number) {
    this._generationBuffer.setSize(width, height)
    this._accumulationBuffer.setSize(width, height)

    this.aoMaterial.uniforms['size'].value.set(width, height)
    this.aoMaterial.needsUpdate = true
  }
}
