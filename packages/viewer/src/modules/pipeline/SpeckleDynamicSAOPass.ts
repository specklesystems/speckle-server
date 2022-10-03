import {
  Camera,
  DoubleSide,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  Vector2
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js'
import { BlurShaderUtils } from 'three/examples/jsm/shaders/DepthLimitedBlurShader.js'
import { speckleSaoFrag } from '../materials/shaders/speckle-sao-frag'
import { speckleSaoVert } from '../materials/shaders/speckle-sao-vert'
import { SAOShader } from 'three/examples/jsm/shaders/SAOShader.js'
import Batcher from '../batching/Batcher'
import SpeckleDepthMaterial from '../materials/SpeckleDepthMaterial'
import SpeckleNormalMaterial from '../materials/SpeckleNormalMaterial'

export enum NormalsType {
  DEFAULT = 0,
  IMPROVED = 1,
  ACCURATE = 2
}

/**
 * SAO implementation inspired from bhouston previous SAO work
 */

export class SpeckleDynamicSAOPass extends SAOPass {
  private _oldClearColor
  private prevStdDev
  private prevNumSamples
  private batcher: Batcher = null
  private normalsType: NormalsType = NormalsType.IMPROVED
  public accumulate = false

  public set normalsRendering(type: NormalsType) {
    this.normalsType = type
    this.saoMaterial.defines['NORMAL_TEXTURE'] =
      this.normalsType === NormalsType.DEFAULT ? 1 : 0
    this.saoMaterial.defines['IMPROVED_NORMAL_RECONSTRUCTION'] =
      this.normalsType === NormalsType.IMPROVED ? 1 : 0
    this.saoMaterial.defines['ACCURATE_NORMAL_RECONSTRUCTION'] =
      this.normalsType === NormalsType.ACCURATE ? 1 : 0
    this.saoMaterial.needsUpdate = true
  }

  constructor(
    scene: Scene,
    camera: Camera,
    batcher: Batcher,
    useDepthTexture = false,
    normalsType: NormalsType,
    resolution = new Vector2(256, 256)
  ) {
    super(scene, camera, useDepthTexture, true, resolution)

    this.batcher = batcher

    this.depthMaterial = new SpeckleDepthMaterial(
      {
        depthPacking: RGBADepthPacking
      },
      ['USE_RTE', 'ALPHATEST_REJECTION']
    )
    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide

    this.normalMaterial = new SpeckleNormalMaterial({}, ['USE_RTE'])
    this.normalMaterial.blending = NoBlending
    this.normalMaterial.side = DoubleSide

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
    this.normalsRendering = normalsType
    this.saoMaterial.extensions.derivatives = true
    this.saoMaterial.defines['DEPTH_PACKING'] = this.supportsDepthTextureExtension
      ? 0
      : 1
    this.saoMaterial.defines['PERSPECTIVE_CAMERA'] = (this.camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.saoMaterial.uniforms['tDepth'].value = this.supportsDepthTextureExtension
      ? this.beautyRenderTarget.depthTexture
      : this.depthRenderTarget.texture
    this.saoMaterial.uniforms['tNormal'].value = this.normalRenderTarget.texture
    this.saoMaterial.uniforms['size'].value.set(this.resolution.x, this.resolution.y)
    this.saoMaterial.uniforms['cameraInverseProjectionMatrix'].value.copy(
      this.camera.projectionMatrixInverse
    )
    this.saoMaterial.uniforms['cameraProjectionMatrix'].value =
      this.camera.projectionMatrix
    this.saoMaterial.blending = NoBlending
  }

  public render(renderer, writeBuffer, readBuffer) {
    writeBuffer
    readBuffer
    if (this.params.output === 1) {
      return
    }

    renderer.getClearColor(this._oldClearColor)
    this.oldClearAlpha = renderer.getClearAlpha()
    renderer.autoClear = false

    renderer.setRenderTarget(this.depthRenderTarget)
    renderer.clear()

    this.saoMaterial.uniforms['bias'].value = this.params.saoBias
    this.saoMaterial.uniforms['intensity'].value = this.params.saoIntensity
    this.saoMaterial.uniforms['scale'].value = this.params.saoScale
    this.saoMaterial.uniforms['kernelRadius'].value = this.params.saoKernelRadius
    this.saoMaterial.uniforms['minResolution'].value = this.params.saoMinResolution
    this.saoMaterial.uniforms['cameraNear'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.saoMaterial.uniforms['cameraFar'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.saoMaterial.uniforms['cameraInverseProjectionMatrix'].value.copy(
      this.camera.projectionMatrixInverse
    )
    this.saoMaterial.uniforms['cameraProjectionMatrix'].value =
      this.camera.projectionMatrix
    // this.saoMaterial.uniforms['randomSeed'].value = Math.random()

    const depthCutoff =
      this.params.saoBlurDepthCutoff *
      ((this.camera as PerspectiveCamera | OrthographicCamera).far -
        (this.camera as PerspectiveCamera | OrthographicCamera).near)
    this.vBlurMaterial.uniforms['depthCutoff'].value = depthCutoff
    this.hBlurMaterial.uniforms['depthCutoff'].value = depthCutoff

    this.vBlurMaterial.uniforms['cameraNear'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.vBlurMaterial.uniforms['cameraFar'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).far
    this.hBlurMaterial.uniforms['cameraNear'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).near
    this.hBlurMaterial.uniforms['cameraFar'].value = (
      this.camera as PerspectiveCamera | OrthographicCamera
    ).far

    this.params.saoBlurRadius = Math.floor(this.params.saoBlurRadius)
    if (
      this.prevStdDev !== this.params.saoBlurStdDev ||
      this.prevNumSamples !== this.params.saoBlurRadius
    ) {
      BlurShaderUtils.configure(
        this.vBlurMaterial,
        this.params.saoBlurRadius,
        this.params.saoBlurStdDev,
        new Vector2(0, 1)
      )
      BlurShaderUtils.configure(
        this.hBlurMaterial,
        this.params.saoBlurRadius,
        this.params.saoBlurStdDev,
        new Vector2(1, 0)
      )
      this.prevStdDev = this.params.saoBlurStdDev
      this.prevNumSamples = this.params.saoBlurRadius
    }

    const restoreVisibility = this.batcher.saveVisiblity()
    const opaque = this.batcher.getOpaque()
    this.batcher.applyVisibility(opaque)
    // Re-render scene if depth texture extension is not supported
    if (!this.supportsDepthTextureExtension) {
      // Clear rule : far clipping plane in both RGBA and Basic encoding
      this.renderOverride(
        renderer,
        this.depthMaterial,
        this.depthRenderTarget,
        0x000000,
        1.0
      )
    }

    if (this.normalsType === NormalsType.DEFAULT) {
      if (this.supportsNormalTexture) {
        // Clear rule : default normal is facing the camera
        this.renderOverride(
          renderer,
          this.normalMaterial,
          this.normalRenderTarget,
          0x7777ff,
          1.0
        )
      }
    }
    this.batcher.applyVisibility(restoreVisibility)

    // Rendering SAO texture
    this.renderPass(renderer, this.saoMaterial, this.saoRenderTarget, 0xffffff, 1.0)

    // Blurring SAO texture
    if (this.params.saoBlur) {
      this.renderPass(
        renderer,
        this.vBlurMaterial,
        this.blurIntermediateRenderTarget,
        0xffffff,
        1.0
      )
      this.renderPass(renderer, this.hBlurMaterial, this.saoRenderTarget, 0xffffff, 1.0)
    }
  }

  public renderPass(
    renderer,
    passMaterial,
    renderTarget,
    clearColor = undefined,
    clearAlpha = undefined
  ) {
    // save original state
    renderer.getClearColor(this.originalClearColor)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    renderer.setRenderTarget(renderTarget)

    // setup pass state
    renderer.autoClear = false
    if (clearColor !== undefined && clearColor !== null && !this.accumulate) {
      renderer.setClearColor(clearColor)
      renderer.setClearAlpha(clearAlpha || 0.0)
      renderer.clear()
    }
    ;(this.fsQuad as FullScreenQuad).material = passMaterial
    ;(this.fsQuad as FullScreenQuad).render(renderer)

    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(this.originalClearColor)
    renderer.setClearAlpha(originalClearAlpha)
  }

  public renderOverride(
    renderer,
    overrideMaterial,
    renderTarget,
    clearColor,
    clearAlpha
  ) {
    renderer.getClearColor(this.originalClearColor)
    const originalClearAlpha = renderer.getClearAlpha()
    const originalAutoClear = renderer.autoClear

    renderer.setRenderTarget(renderTarget)
    renderer.autoClear = false

    clearColor = overrideMaterial.clearColor || clearColor
    clearAlpha = overrideMaterial.clearAlpha || clearAlpha
    if (clearColor !== undefined && clearColor !== null) {
      renderer.setClearColor(clearColor)
      renderer.setClearAlpha(clearAlpha || 0.0)
      renderer.clear()
    }

    const shadowmapEnabled = renderer.shadowMap.enabled
    const shadowmapNeedsUpdate = renderer.shadowMap.needsUpdate
    this.scene.overrideMaterial = overrideMaterial
    renderer.shadowMap.enabled = false
    renderer.shadowMap.needsUpdate = false
    renderer.render(this.scene, this.camera)
    renderer.shadowMap.enabled = shadowmapEnabled
    renderer.shadowMap.needsUpdate = shadowmapNeedsUpdate
    this.scene.overrideMaterial = null

    // restore original state
    renderer.autoClear = originalAutoClear
    renderer.setClearColor(this.originalClearColor)
    renderer.setClearAlpha(originalClearAlpha)
  }
}
