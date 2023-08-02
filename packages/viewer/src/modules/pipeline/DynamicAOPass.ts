import {
  Camera,
  Color,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  Vector2,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js'
import { speckleSaoFrag } from '../materials/shaders/speckle-sao-frag'
import { speckleSaoVert } from '../materials/shaders/speckle-sao-vert'
import { SAOShader } from 'three/examples/jsm/shaders/SAOShader.js'
import { DepthLimitedBlurShader } from 'three/examples/jsm/shaders/DepthLimitedBlurShader.js'
import { BlurShaderUtils } from 'three/examples/jsm/shaders/DepthLimitedBlurShader.js'
import {
  InputDepthTextureUniform,
  InputNormalsTextureUniform,
  SpecklePass
} from './SpecklePass'

export enum NormalsType {
  DEFAULT = 0,
  IMPROVED = 1,
  ACCURATE = 2
}

export enum DynamicAOOutputType {
  RECONSTRUCTED_NORMALS,
  AO,
  AO_BLURRED
}

export interface DynamicAOPassParams {
  intensity: number
  scale: number
  kernelRadius: number
  bias: number
  normalsType: NormalsType
  blurEnabled: boolean
  blurRadius: number
  blurStdDev: number
  blurDepthCutoff: number
}

export const DefaultDynamicAOPassParams = {
  intensity: 1.5,
  scale: 0,
  kernelRadius: 5,
  bias: 0.2,
  normalsType: NormalsType.ACCURATE,
  blurEnabled: true,
  blurRadius: 2,
  blurStdDev: 4,
  blurDepthCutoff: 0.007
}

export class DynamicSAOPass extends Pass implements SpecklePass {
  private params: DynamicAOPassParams = DefaultDynamicAOPassParams
  private colorBuffer: Color = new Color()
  private saoMaterial: ShaderMaterial = null
  private vBlurMaterial: ShaderMaterial = null
  private hBlurMaterial: ShaderMaterial = null
  private saoRenderTarget: WebGLRenderTarget = null
  private blurIntermediateRenderTarget: WebGLRenderTarget = null
  private fsQuad: FullScreenQuad = null
  private _outputType: DynamicAOOutputType = DynamicAOOutputType.AO_BLURRED
  private outputScale = 0.5

  private prevStdDev: number
  private prevNumSamples: number

  public get displayName(): string {
    return 'SAO'
  }

  public get outputTexture(): Texture {
    return this.saoRenderTarget.texture
  }

  constructor() {
    super()

    this.saoRenderTarget = new WebGLRenderTarget(256, 256)
    this.blurIntermediateRenderTarget = new WebGLRenderTarget(256, 256)
    this.saoMaterial = new ShaderMaterial({
      defines: {
        NUM_SAMPLES: 7,
        NUM_RINGS: 4,
        NORMAL_TEXTURE: 0,
        DIFFUSE_TEXTURE: 0,
        DEPTH_PACKING: 1,
        PERSPECTIVE_CAMERA: 1
      },
      fragmentShader: speckleSaoFrag,
      vertexShader: speckleSaoVert,
      uniforms: UniformsUtils.clone(SAOShader.uniforms)
    })
    this.saoMaterial.extensions.derivatives = true
    this.saoMaterial.defines['DEPTH_PACKING'] = 1
    this.saoMaterial.uniforms['tDepth'].value = null
    this.saoMaterial.uniforms['tNormal'].value = null
    this.saoMaterial.uniforms['size'].value.set(256, 256)
    this.saoMaterial.uniforms['minResolution'].value = 0
    this.saoMaterial.blending = NoBlending

    this.vBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.vBlurMaterial.defines['DEPTH_PACKING'] = 1

    this.vBlurMaterial.uniforms['tDiffuse'].value = this.saoRenderTarget.texture
    this.vBlurMaterial.uniforms['tDepth'].value = null
    this.vBlurMaterial.uniforms['size'].value.set(256, 256)
    this.vBlurMaterial.blending = NoBlending

    this.hBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.hBlurMaterial.defines['DEPTH_PACKING'] = 1

    this.hBlurMaterial.uniforms['tDiffuse'].value =
      this.blurIntermediateRenderTarget.texture
    this.hBlurMaterial.uniforms['tDepth'].value = null
    this.hBlurMaterial.uniforms['size'].value.set(256, 256)
    this.hBlurMaterial.blending = NoBlending

    this.fsQuad = new FullScreenQuad(this.saoMaterial)
  }

  public setParams(params: unknown) {
    Object.assign(this.params, params)
  }

  public setOutputType(type: DynamicAOOutputType) {
    this._outputType = type
  }

  public setTexture(
    uName: InputDepthTextureUniform | InputNormalsTextureUniform,
    texture: Texture
  ) {
    if (uName === 'tDepth') {
      this.saoMaterial.uniforms['tDepth'].value = texture
      this.vBlurMaterial.uniforms['tDepth'].value = texture
      this.hBlurMaterial.uniforms['tDepth'].value = texture
    }
    if (uName === 'tNormal') {
      this.saoMaterial.uniforms['tNormal'].value = texture
    }
    this.saoMaterial.needsUpdate = true
    this.vBlurMaterial.needsUpdate = true
    this.hBlurMaterial.needsUpdate = true
  }

  public update(scene: Scene, camera: Camera) {
    if (this._outputType === DynamicAOOutputType.RECONSTRUCTED_NORMALS) {
      this.saoMaterial.defines['OUTPUT_RECONSTRUCTED_NORMALS'] = ''
    } else {
      delete this.saoMaterial.defines['OUTPUT_RECONSTRUCTED_NORMALS']
    }

    this.params.scale = (camera as PerspectiveCamera | OrthographicCamera).far
    /** SAO DEFINES */
    this.saoMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0

    this.saoMaterial.defines['NORMAL_TEXTURE'] =
      this.params.normalsType === NormalsType.DEFAULT ? 1 : 0
    this.saoMaterial.defines['IMPROVED_NORMAL_RECONSTRUCTION'] =
      this.params.normalsType === NormalsType.IMPROVED ? 1 : 0
    this.saoMaterial.defines['ACCURATE_NORMAL_RECONSTRUCTION'] =
      this.params.normalsType === NormalsType.ACCURATE ? 1 : 0

    /** SAO UNIFORMS */
    this.saoMaterial.uniforms['cameraNear'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.saoMaterial.uniforms['cameraFar'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.saoMaterial.uniforms['cameraInverseProjectionMatrix'].value.copy(
      camera.projectionMatrixInverse
    )
    this.saoMaterial.uniforms['cameraProjectionMatrix'].value = camera.projectionMatrix

    /** SAO UNIFORM PARAMS */
    this.saoMaterial.uniforms['intensity'].value = this.params.intensity
    this.saoMaterial.uniforms['scale'].value = this.params.scale
    this.saoMaterial.uniforms['kernelRadius'].value = this.params.kernelRadius
    this.saoMaterial.uniforms['bias'].value = this.params.bias

    this.saoMaterial.needsUpdate = true

    /** BLUR DEFINES */
    this.vBlurMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.hBlurMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0

    /** BLUR UNIFORMS */
    this.vBlurMaterial.uniforms['cameraNear'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.vBlurMaterial.uniforms['cameraFar'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.hBlurMaterial.uniforms['cameraNear'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.hBlurMaterial.uniforms['cameraFar'].value = (
      camera as PerspectiveCamera | OrthographicCamera
    ).far

    /** BLUR UNIFORM PARAMS */
    const depthCutoff =
      this.params.blurDepthCutoff *
      ((camera as PerspectiveCamera | OrthographicCamera).far -
        (camera as PerspectiveCamera | OrthographicCamera).near)
    this.vBlurMaterial.uniforms['depthCutoff'].value = depthCutoff
    this.hBlurMaterial.uniforms['depthCutoff'].value = depthCutoff

    this.params.blurRadius = Math.floor(this.params.blurRadius)
    if (
      this.prevStdDev !== this.params.blurStdDev ||
      this.prevNumSamples !== this.params.blurRadius
    ) {
      BlurShaderUtils.configure(
        this.vBlurMaterial,
        this.params.blurRadius,
        this.params.blurStdDev,
        new Vector2(0, 1)
      )
      BlurShaderUtils.configure(
        this.hBlurMaterial,
        this.params.blurRadius,
        this.params.blurStdDev,
        new Vector2(1, 0)
      )
      this.prevStdDev = this.params.blurStdDev
      this.prevNumSamples = this.params.blurRadius
    }
    this.vBlurMaterial.needsUpdate = true
    this.hBlurMaterial.needsUpdate = true
  }

  public render(renderer) {
    // Rendering SAO texture
    renderer.getClearColor(this.colorBuffer)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    renderer.setRenderTarget(this.saoRenderTarget)

    // setup pass state
    renderer.autoClear = false
    renderer.setClearColor(0xffffff)
    renderer.setClearAlpha(1.0)
    renderer.clear()
    this.fsQuad.material = this.saoMaterial
    this.fsQuad.render(renderer)

    if (
      this.params.blurEnabled &&
      this._outputType === DynamicAOOutputType.AO_BLURRED
    ) {
      renderer.setRenderTarget(this.blurIntermediateRenderTarget)
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1.0)
      renderer.clear()
      this.fsQuad.material = this.vBlurMaterial
      this.fsQuad.render(renderer)

      renderer.setRenderTarget(this.saoRenderTarget)
      this.fsQuad.material = this.hBlurMaterial
      this.fsQuad.render(renderer)
    }

    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(this.colorBuffer)
    renderer.setClearAlpha(originalClearAlpha)
  }

  public setSize(inputWidth: number, inputHeight: number) {
    const width = inputWidth * this.outputScale
    const height = inputHeight * this.outputScale
    this.saoRenderTarget.setSize(width, height)
    this.blurIntermediateRenderTarget.setSize(width, height)

    this.saoMaterial.uniforms['size'].value.set(width, height)
    this.vBlurMaterial.uniforms['size'].value.set(width, height)
    this.hBlurMaterial.uniforms['size'].value.set(width, height)
    this.saoMaterial.needsUpdate = true
  }
}
