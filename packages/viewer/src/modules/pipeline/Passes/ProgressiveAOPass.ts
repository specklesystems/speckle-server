import {
  AddEquation,
  CustomBlending,
  DataTexture,
  FloatType,
  MathUtils,
  Matrix4,
  NoBlending,
  OneFactor,
  OrthographicCamera,
  PerspectiveCamera,
  RepeatWrapping,
  ReverseSubtractEquation,
  RGBAFormat,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { PassOptions, ProgressiveGPass } from './GPass.js'
import { speckleStaticAoAccumulateFrag } from '../../materials/shaders/speckle-static-ao-accumulate-frag.js'
import { speckleStaticAoAccumulateVert } from '../../materials/shaders/speckle-static-ao-accumulate-vert.js'
import { speckleStaticAoGenerateVert } from '../../materials/shaders/speckle-static-ao-generate-vert.js'
import { speckleStaticAoGenerateFrag } from '../../materials/shaders/speckle-static-ao-generate-frag.js'

/**
 * SAO implementation inspired from bhouston previous SAO work
 */

export interface ProgressiveAOPassOptions extends PassOptions {
  intensity?: number
  kernelRadius?: number
  kernelSize?: number
  bias?: number
}

export const DefaultProgressiveAOPassOptions: Required<ProgressiveAOPassOptions> = {
  intensity: 1,
  kernelRadius: 30, // Screen space
  bias: 0.01,
  kernelSize: 16
}

export class ProgressiveAOPass extends ProgressiveGPass {
  private generationMaterial: ShaderMaterial
  private accumulateMaterial: ShaderMaterial

  private _generationBuffer: WebGLRenderTarget

  public _options: Required<ProgressiveAOPassOptions> = Object.assign(
    {},
    DefaultProgressiveAOPassOptions
  )

  private fsQuad: FullScreenQuad

  private kernels: Array<Array<Vector3>> = []
  private noiseTextures: Array<Texture> = []

  public setTexture(uName: string, texture: Texture | undefined) {
    this.generationMaterial.uniforms[uName].value = texture
    this.generationMaterial.needsUpdate = true
  }

  public get displayName(): string {
    return 'PROGRESSIVE-AO'
  }

  public set options(value: ProgressiveAOPassOptions) {
    super.options = value
    this.kernels = []
    this.noiseTextures = []
  }

  constructor() {
    super()

    this._generationBuffer = new WebGLRenderTarget(256, 256)
    this._outputTarget = new WebGLRenderTarget(256, 256)

    this.generationMaterial = new ShaderMaterial({
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
        tanFov: { value: 0 },

        intensity: { value: this._options.intensity },
        bias: { value: this._options.bias },
        kernelRadius: { value: this._options.kernelRadius }, // World space

        tNoise: { value: null },
        kernel: { value: null }

        /** Only used with McGuire-like estimator */
        // minResolution: { value: 0 },
        // frameIndex: { value: 0 },
        // scale: { value: 1 }
      }
    })

    this.generationMaterial.extensions.derivatives = true
    this.generationMaterial.uniforms['size'].value.set(256, 256)
    this.generationMaterial.blending = NoBlending
    this.generationMaterial.uniformsNeedUpdate = true

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

    this.fsQuad = new FullScreenQuad(this.generationMaterial)
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    /** DEFINES */
    this.generationMaterial.defines['PERSPECTIVE_CAMERA'] = (
      camera as PerspectiveCamera
    ).isPerspectiveCamera
      ? 1
      : 0
    this.generationMaterial.defines['NUM_FRAMES'] = this.accumulationFrames
    this.generationMaterial.defines['KERNEL_SIZE'] = this._options.kernelSize
    this.accumulateMaterial.defines['NUM_FRAMES'] = this.accumulationFrames

    /** UNIFORMS */
    this.generationMaterial.uniforms['cameraNear'].value = camera.near
    this.generationMaterial.uniforms['cameraFar'].value = camera.far
    this.generationMaterial.uniforms['cameraInverseProjectionMatrix'].value.copy(
      camera.projectionMatrixInverse
    )
    this.generationMaterial.uniforms['cameraProjectionMatrix'].value.copy(
      camera.projectionMatrix
    )
    const fov = (((camera as PerspectiveCamera).fov / 2) * Math.PI) / 180.0
    this.generationMaterial.uniforms['tanFov'].value = Math.tan(fov)

    if (!this.kernels[this.frameIndex]) {
      this.generateSampleKernel(this.frameIndex)
    }
    if (!this.noiseTextures[this.frameIndex]) {
      this.generateRandomKernelRotations(this.frameIndex)
    }
    this.generationMaterial.uniforms['kernel'].value = this.kernels[this.frameIndex]
    this.generationMaterial.uniforms['tNoise'].value =
      this.noiseTextures[this.frameIndex]

    this.generationMaterial.uniforms['intensity'].value = this._options.intensity
    this.generationMaterial.uniforms['kernelRadius'].value = this._options.kernelRadius
    this.generationMaterial.uniforms['bias'].value = this._options.bias

    this.generationMaterial.needsUpdate = true
    this.accumulateMaterial.needsUpdate = true
  }

  public render(renderer: WebGLRenderer): boolean {
    renderer.setRenderTarget(this._generationBuffer)
    renderer.setClearColor(0x000000)
    renderer.setClearAlpha(1)
    renderer.clear(true)
    this.fsQuad.material = this.generationMaterial
    this.fsQuad.render(renderer)

    renderer.setRenderTarget(this._outputTarget)
    if (this.frameIndex === 0) {
      this.clear(renderer)
    }

    this.fsQuad.material = this.accumulateMaterial
    this.fsQuad.render(renderer)

    return super.render(renderer)
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)
    this._generationBuffer.setSize(width, height)

    this.generationMaterial.uniforms['size'].value.set(width, height)
    this.generationMaterial.needsUpdate = true
  }

  protected generateSampleKernel(frameIndex: number) {
    const kernelSize = this._options.kernelSize || 0
    this.kernels[frameIndex] = []

    for (let i = 0; i < kernelSize; i++) {
      const sample = new Vector3()
      sample.x = Math.random() * 2 - 1
      sample.y = Math.random() * 2 - 1
      sample.z = Math.random()

      sample.normalize()

      let scale = i / kernelSize
      scale = MathUtils.lerp(0.1, 1, scale * scale)
      sample.multiplyScalar(scale)

      this.kernels[frameIndex].push(sample)
    }
  }

  protected generateRandomKernelRotations(frameIndex: number) {
    const width = 4,
      height = 4

    if (SimplexNoise === undefined) {
      console.error('The pass relies on SimplexNoise.')
    }

    const simplex = new SimplexNoise()

    const size = width * height * 4
    const data = new Float32Array(size)

    for (let i = 0; i < size; i += 4) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = 0

      data[i] = simplex.noise3d(x, y, z)
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
    }

    this.noiseTextures[frameIndex] = new DataTexture(
      data,
      width,
      height,
      RGBAFormat,
      FloatType
    )
    this.noiseTextures[frameIndex].wrapS = RepeatWrapping
    this.noiseTextures[frameIndex].wrapT = RepeatWrapping
    this.noiseTextures[frameIndex].needsUpdate = true
  }
}
