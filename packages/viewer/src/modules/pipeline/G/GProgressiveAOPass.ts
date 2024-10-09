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
  RedFormat,
  RepeatWrapping,
  ReverseSubtractEquation,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { ProgressiveGPass } from './GPass.js'
import { speckleStaticAoAccumulateFrag } from '../../materials/shaders/speckle-static-ao-accumulate-frag.js'
import { speckleStaticAoAccumulateVert } from '../../materials/shaders/speckle-static-ao-accumulate-vert.js'
import { speckleStaticAoGenerateVert } from '../../materials/shaders/speckle-static-ao-generate-vert.js'
import { speckleStaticAoGenerateFrag } from '../../materials/shaders/speckle-static-ao-generate-frag.js'

/**
 * SAO implementation inspired from bhouston previous SAO work
 */

export interface StaticAoPassParams {
  intensity?: number
  kernelRadius?: number
  kernelSize?: number
  bias?: number
  minDistance?: number
  maxDistance?: number
}

export const DefaultStaticAoPassParams = {
  intensity: 1,
  kernelRadius: 30, // Screen space
  kernelSize: 16,
  bias: 0.01,
  minDistance: 0,
  maxDistance: 0.008
}

export class GProgressiveAOPass extends ProgressiveGPass {
  private generationMaterial: ShaderMaterial
  private accumulateMaterial: ShaderMaterial

  private _generationBuffer: WebGLRenderTarget

  private params: StaticAoPassParams = DefaultStaticAoPassParams

  private fsQuad: FullScreenQuad

  private kernels: Array<Array<Vector3>> = []
  private noiseTextures: Array<Texture> = []

  public setTexture(uName: string, texture: Texture | undefined) {
    this.generationMaterial.uniforms[uName].value = texture
    this.generationMaterial.uniforms[uName].value = texture
    this.generationMaterial.needsUpdate = true
  }

  public get displayName(): string {
    return 'STATIC-AO'
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

        scale: { value: 1.0 },
        intensity: { value: 1 },
        bias: { value: 0 },

        minResolution: { value: 0.0 },
        kernelRadius: { value: 0.5 }, // World space

        frameIndex: { value: 0 },

        tNoise: { value: null },
        kernel: { value: null },
        minDistance: { value: 0.001 },
        maxDistance: { value: 1 }
      }
    })

    this.generationMaterial.extensions.derivatives = true
    this.generationMaterial.uniforms['size'].value.set(256, 256)
    this.generationMaterial.blending = NoBlending

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

  public setParams(params: unknown) {
    Object.assign(this.params, params)
    this.kernels = []
    this.noiseTextures = []
  }

  public update(camera: PerspectiveCamera | OrthographicCamera) {
    /** DEFINES */
    this.generationMaterial.defines['PERSPECTIVE_CAMERA'] = (
      camera as PerspectiveCamera
    ).isPerspectiveCamera
      ? 1
      : 0
    this.generationMaterial.defines['NUM_FRAMES'] = this.accumulationFrames
    this.generationMaterial.defines['KERNEL_SIZE'] = this.params.kernelSize
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

    this.generationMaterial.uniforms['intensity'].value = this.params.intensity
    this.generationMaterial.uniforms['kernelRadius'].value = this.params.kernelRadius
    this.generationMaterial.uniforms['bias'].value = this.params.bias
    this.generationMaterial.uniforms['frameIndex'].value = this.frameIndex

    this.generationMaterial.uniforms['minDistance'].value = this.params.minDistance
    this.generationMaterial.uniforms['maxDistance'].value = this.params.maxDistance
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
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1)
      renderer.clear(true)
    }

    this.fsQuad.material = this.accumulateMaterial
    this.fsQuad.render(renderer)

    if (this._frameIndex >= this._accumulationFrames) {
      return false
    }
    return true
  }

  public setSize(width: number, height: number) {
    super.setSize(width, height)
    this._generationBuffer.setSize(width, height)

    this.generationMaterial.uniforms['size'].value.set(width, height)
    this.generationMaterial.needsUpdate = true
  }

  private generateSampleKernel(frameIndex: number) {
    const kernelSize = this.params.kernelSize || 0
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

  private generateRandomKernelRotations(frameIndex: number) {
    const width = 4,
      height = 4

    if (SimplexNoise === undefined) {
      console.error('The pass relies on SimplexNoise.')
    }

    const simplex = new SimplexNoise()

    const size = width * height
    const data = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const x = Math.random() * 2 - 1
      const y = Math.random() * 2 - 1
      const z = 0

      data[i] = simplex.noise3d(x, y, z)
    }

    this.noiseTextures[frameIndex] = new DataTexture(
      data,
      width,
      height,
      RedFormat,
      FloatType
    )
    this.noiseTextures[frameIndex].wrapS = RepeatWrapping
    this.noiseTextures[frameIndex].wrapT = RepeatWrapping
    this.noiseTextures[frameIndex].needsUpdate = true
  }
}
