import {
  AddEquation,
  Camera,
  Color,
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
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'

import { speckleStaticAoGenerateVert } from '../materials/shaders/speckle-static-ao-generate-vert'
import { speckleStaticAoGenerateFrag } from '../materials/shaders/speckle-static-ao-generate-frag'
import { speckleStaticAoAccumulateVert } from '../materials/shaders/speckle-static-ao-accumulate-vert'
import { speckleStaticAoAccumulateFrag } from '../materials/shaders/speckle-static-ao-accumulate-frag'
import { SimplexNoise } from 'three/examples/jsm//math/SimplexNoise.js'
import {
  InputDepthTextureUniform,
  InputNormalsTextureUniform,
  SpeckleProgressivePass
} from './SpecklePass'
import { Pipeline } from './Pipeline'
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

export class StaticAOPass extends Pass implements SpeckleProgressivePass {
  public aoMaterial: ShaderMaterial = null
  private accumulateMaterial: ShaderMaterial = null
  private _generationBuffer: WebGLRenderTarget
  private _accumulationBuffer: WebGLRenderTarget
  private params: StaticAoPassParams = DefaultStaticAoPassParams
  private fsQuad: FullScreenQuad
  private frameIndex = 0
  private kernels: Array<Array<Vector3>> = []
  private noiseTextures: Array<Texture> = []

  public setTexture(
    uName: InputDepthTextureUniform | InputNormalsTextureUniform,
    texture: Texture
  ) {
    if (uName === 'tDepth') {
      this.aoMaterial.uniforms['tDepth'].value = texture
    }
    if (uName === 'tNormal') {
      this.aoMaterial.uniforms['tNormal'].value = texture
    }
    this.aoMaterial.needsUpdate = true
  }

  public get outputTexture() {
    return this._accumulationBuffer.texture
  }

  public get displayName(): string {
    return 'STATIC-AO'
  }

  constructor() {
    super()

    this._generationBuffer = new WebGLRenderTarget(256, 256)
    this._accumulationBuffer = new WebGLRenderTarget(256, 256)

    this.aoMaterial = new ShaderMaterial({
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

  public setParams(params: unknown) {
    Object.assign(this.params, params)
    this.kernels = []
    this.noiseTextures = []
  }

  public setFrameIndex(index: number) {
    this.frameIndex = index
  }

  public update(scene: Scene, camera: Camera) {
    /** DEFINES */
    this.aoMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.aoMaterial.defines['NUM_FRAMES'] = Pipeline.ACCUMULATE_FRAMES
    this.aoMaterial.defines['KERNEL_SIZE'] = this.params.kernelSize
    this.accumulateMaterial.defines['NUM_FRAMES'] = Pipeline.ACCUMULATE_FRAMES
    /** UNIFORMS */
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
    const fov = (((camera as PerspectiveCamera).fov / 2) * Math.PI) / 180.0
    this.aoMaterial.uniforms['tanFov'].value = Math.tan(fov)

    if (!this.kernels[this.frameIndex]) {
      this.generateSampleKernel(this.frameIndex)
    }
    if (!this.noiseTextures[this.frameIndex]) {
      this.generateRandomKernelRotations(this.frameIndex)
    }
    this.aoMaterial.uniforms['kernel'].value = this.kernels[this.frameIndex]
    this.aoMaterial.uniforms['tNoise'].value = this.noiseTextures[this.frameIndex]

    this.aoMaterial.uniforms['intensity'].value = this.params.intensity
    this.aoMaterial.uniforms['kernelRadius'].value = this.params.kernelRadius
    this.aoMaterial.uniforms['bias'].value = this.params.bias
    this.aoMaterial.uniforms['frameIndex'].value = this.frameIndex

    this.aoMaterial.uniforms['minDistance'].value = this.params.minDistance
    this.aoMaterial.uniforms['maxDistance'].value = this.params.maxDistance
    this.aoMaterial.needsUpdate = true
    this.accumulateMaterial.needsUpdate = true
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
    renderer.clear(true)
    this.fsQuad.material = this.aoMaterial
    this.fsQuad.render(renderer)

    renderer.setRenderTarget(this._accumulationBuffer)
    if (this.frameIndex === 0) {
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1)
      renderer.clear(true)
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

  private generateSampleKernel(frameIndex: number) {
    const kernelSize = this.params.kernelSize
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
      console.error('THREE.SSAOPass: The pass relies on SimplexNoise.')
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
