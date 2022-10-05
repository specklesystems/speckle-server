import {
  Camera,
  Matrix4,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderTarget
} from 'three'
import { Pass } from 'three/examples/jsm/postprocessing/Pass'

import Batcher from '../batching/Batcher'
import { speckleStaticAoGenerateVert } from '../materials/shaders/speckle-static-ao-generate-vert'
import { speckleStaticAoGenerateFrag } from '../materials/shaders/speckle-static-ao-generate-frag'
/**
 * SAO implementation inspired from bhouston previous SAO work
 */

export class SpeckleStaticAOGeneratePass extends Pass {
  private batcher: Batcher = null
  private aoMaterial: ShaderMaterial = null
  private _depthTexture: Texture
  private _normalTexture: Texture
  private _generationBuffer: WebGLRenderTarget
  private _accumulationBuffer: WebGLRenderTarget
  private _renderIndex = 0

  public set depthTexture(value: Texture) {
    this._depthTexture = value
  }

  public set normalTexture(value: Texture) {
    this._normalTexture = value
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
      fragmentShader: speckleStaticAoGenerateVert,
      vertexShader: speckleStaticAoGenerateFrag,
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        size: { value: new Vector2(512, 512) },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() },

        scale: { value: 1.0 },
        intensity: { value: 0.1 },
        bias: { value: 0.5 },

        minResolution: { value: 0.0 },
        kernelRadius: { value: 100.0 },
        randomSeed: { value: 0.0 }
      }
    })

    this.aoMaterial.extensions.derivatives = true
    this.aoMaterial.uniforms['size'].value.set(256, 256)
    this.aoMaterial.blending = NoBlending
  }

  public update(camera: Camera) {
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
  }

  public render(renderer, writeBuffer, readBuffer) {
    renderer
    writeBuffer
    readBuffer
  }

  public setSize(width: number, height: number) {
    this._generationBuffer.setSize(width, height)
    this._accumulationBuffer.setSize(width, height)

    this.aoMaterial.uniforms['size'].value.set(width, height)
    this.aoMaterial.needsUpdate = true
  }
}
