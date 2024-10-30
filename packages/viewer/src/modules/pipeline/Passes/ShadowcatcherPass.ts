import {
  BasicDepthPacking,
  Box3,
  CameraHelper,
  Color,
  DoubleSide,
  LinearFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import {
  BlurShaderUtils,
  DepthLimitedBlurShader
} from 'three/examples/jsm/shaders/DepthLimitedBlurShader.js'
import SpeckleDepthMaterial from '../../materials/SpeckleDepthMaterial.js'
import SpeckleShadowcatcherMaterial from '../../materials/SpeckleShadowcatcherMaterial.js'
import { ObjectLayers } from '../../../IViewer.js'
import {
  DefaultShadowcatcherConfig,
  type ShadowcatcherConfig
} from '../../ShadowcatcherConfig.js'
import type { SpeckleWebGLRenderer } from '../../objects/SpeckleWebGLRenderer.js'
import { BaseGPass } from './GPass.js'

export class ShadowcatcherPass extends BaseGPass {
  private readonly levels: number = 4
  private readonly debugCamera = false
  private renderTargets: WebGLRenderTarget[] = []
  private tempTargets: WebGLRenderTarget[] = []
  private camera: OrthographicCamera
  private scene!: Scene
  private _needsUpdate = false

  private fsQuad: FullScreenQuad
  private blendMaterial: SpeckleShadowcatcherMaterial
  private depthMaterial: SpeckleDepthMaterial
  private vBlurMaterial: ShaderMaterial
  private hBlurMaterial: ShaderMaterial
  private blurStdDev = DefaultShadowcatcherConfig.stdDeviation
  private blurRadius = DefaultShadowcatcherConfig.blurRadius
  private prevBlurStdDev = 0
  private prevBlurRadius = 0
  private cameraHelper!: CameraHelper

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  get displayName(): string {
    return 'Shadowcatcher'
  }

  get outputTexture(): Texture | null {
    return this.outputTarget ? this.outputTarget.texture : null
  }

  set needsUpdate(value: boolean) {
    this._needsUpdate = value
  }

  get drawDepthMaterial() {
    return this.depthMaterial
  }

  constructor() {
    super()
    for (let k = 0; k < this.levels; k++) {
      const rt = new WebGLRenderTarget(256, 256, {
        minFilter: LinearFilter,
        magFilter: LinearFilter
      })
      this.renderTargets.push(rt)
      this.tempTargets.push(rt.clone())
    }

    this.outputTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.outputTarget.texture.wrapS = RepeatWrapping
    this.outputTarget.texture.wrapT = RepeatWrapping

    this.camera = new OrthographicCamera(256 / -2, 256 / 2, 256 / 2, 256 / -2, 0, 10)

    this.vBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.vBlurMaterial.defines['DEPTH_PACKING'] = 1
    this.vBlurMaterial.blending = NoBlending

    this.hBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.hBlurMaterial.defines['DEPTH_PACKING'] = 1
    this.hBlurMaterial.blending = NoBlending

    this.depthMaterial = new SpeckleDepthMaterial(
      {
        depthPacking: BasicDepthPacking
      },
      ['USE_RTE']
    )
    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide

    this.blendMaterial = new SpeckleShadowcatcherMaterial({})
    this.fsQuad = new FullScreenQuad(this.vBlurMaterial)
  }

  public update(scene: Scene) {
    this.scene = scene
    if (this._needsUpdate) {
      if (!this.cameraHelper && this.debugCamera) {
        this.cameraHelper = new CameraHelper(this.camera)
        this.cameraHelper.layers.set(ObjectLayers.PROPS)
        this.scene.add(this.cameraHelper)
      }
      if (this.cameraHelper) {
        this.cameraHelper.update()
      }

      /** BLUR DEFINES */
      this.vBlurMaterial.defines['PERSPECTIVE_CAMERA'] = 0
      this.hBlurMaterial.defines['PERSPECTIVE_CAMERA'] = 0

      /** BLUR UNIFORMS */
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

      /** BLUR UNIFORM PARAMS */
      const depthCutoff = 0
      this.vBlurMaterial.uniforms['depthCutoff'].value = depthCutoff
      this.hBlurMaterial.uniforms['depthCutoff'].value = depthCutoff
      if (
        this.prevBlurStdDev !== this.blurStdDev ||
        this.prevBlurRadius !== this.blurRadius
      ) {
        BlurShaderUtils.configure(
          this.vBlurMaterial,
          this.blurRadius,
          this.blurStdDev,
          new Vector2(0, 1)
        )
        BlurShaderUtils.configure(
          this.hBlurMaterial,
          this.blurRadius,
          this.blurStdDev,
          new Vector2(1, 0)
        )
        this.prevBlurStdDev = this.blurStdDev
        this.prevBlurRadius = this.blurRadius
      }

      this.vBlurMaterial.needsUpdate = true
      this.hBlurMaterial.needsUpdate = true
    }
  }

  public render(_renderer: WebGLRenderer): boolean {
    if (this._needsUpdate) {
      const renderer = _renderer as SpeckleWebGLRenderer
      renderer.RTEBuffers.push()
      renderer.updateRTEViewModel(this.camera)

      const colorBuffer = new Color()
      renderer.getClearColor(colorBuffer)
      const originalClearAlpha = renderer.getClearAlpha()
      const originalAutoClear = renderer.autoClear

      if (this.onBeforeRender) this.onBeforeRender()
      this.applyLayers(this.camera)

      const maxCameraFar = this.camera.far
      for (let k = 0; k < this.renderTargets.length; k++) {
        this.camera.far = maxCameraFar
        if (k < 2) {
          this.camera.far = maxCameraFar / 100
        }
        if (k === 2) {
          this.camera.far = maxCameraFar / 4
        }

        this.camera.updateProjectionMatrix()

        renderer.setRenderTarget(this.renderTargets[k])
        renderer.setClearColor(0x000000)
        renderer.setClearAlpha(1)
        renderer.render(this.scene, this.camera)
        this.scene.overrideMaterial = null

        renderer.setRenderTarget(this.tempTargets[k])
        renderer.setClearColor(0xffffff)
        renderer.setClearAlpha(1.0)
        renderer.clear()
        this.vBlurMaterial.uniforms['tDiffuse'].value = this.renderTargets[k].texture
        this.vBlurMaterial.uniforms['size'].value.set(
          this.renderTargets[k].width,
          this.renderTargets[k].height
        )
        this.vBlurMaterial.needsUpdate = true
        this.fsQuad.material = this.vBlurMaterial
        this.fsQuad.render(renderer)

        renderer.setRenderTarget(this.renderTargets[k])
        this.hBlurMaterial.uniforms['tDiffuse'].value = this.tempTargets[k].texture
        this.hBlurMaterial.uniforms['size'].value.set(
          this.tempTargets[k].width,
          this.tempTargets[k].height
        )
        this.hBlurMaterial.needsUpdate
        this.fsQuad.material = this.hBlurMaterial
        this.fsQuad.render(renderer)
      }

      renderer.setRenderTarget(this.outputTarget)
      renderer.setClearColor(0x000000)
      renderer.setClearAlpha(1)
      this.blendMaterial.userData.tex0.value = this.renderTargets[0].texture
      this.blendMaterial.userData.tex1.value = this.renderTargets[1].texture
      this.blendMaterial.userData.tex2.value = this.renderTargets[2].texture
      this.blendMaterial.userData.tex3.value = this.renderTargets[3].texture
      this.fsQuad.material = this.blendMaterial
      this.fsQuad.render(renderer)

      renderer.setRenderTarget(null)
      renderer.autoClear = originalAutoClear
      renderer.setClearColor(colorBuffer)
      renderer.setClearAlpha(originalClearAlpha)

      renderer.RTEBuffers.pop()

      if (this.onAfterRender) this.onAfterRender()
      this._needsUpdate = false
    }
    return false
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.depthMaterial.clippingPlanes = planes
    this.depthMaterial.needsUpdate = true
  }

  public setOutputSize(width: number, height: number) {
    if (
      this.renderTargets[0].width !== width ||
      this.renderTargets[0].height !== height
    ) {
      this.outputTarget?.setSize(width, height)
      this.blendMaterial.needsUpdate = true
      let div = 1
      for (let k = 0; k < this.renderTargets.length; k++) {
        const w = Math.trunc(width * div)
        const h = Math.trunc(height * div)
        this.renderTargets[k].setSize(w, h)
        this.tempTargets[k].setSize(w, h)
        div *= 0.5
      }
    }
  }

  public setWeights(weights: { x: number; y: number; z: number; w: number }) {
    this.blendMaterial.userData.weights.value = new Vector4(
      weights.x,
      weights.y,
      weights.z,
      weights.w
    )
    this.blendMaterial.needsUpdate = true
  }

  public updateCamera(planeBox: Box3, near: number, far: number) {
    const planeSize = planeBox.getSize(new Vector3())
    const planeCenter = planeBox.getCenter(new Vector3())
    this.camera.position.copy(
      new Vector3().copy(planeCenter).add(new Vector3(0, 0, -0.001))
    )
    this.camera.lookAt(planeCenter)
    this.camera.left = planeSize.x / -2
    this.camera.right = planeSize.x / 2
    this.camera.top = planeSize.y / 2
    this.camera.bottom = planeSize.y / -2
    this.camera.near = near
    this.camera.far = far
    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld(true)
  }

  public updateConfig(config: ShadowcatcherConfig) {
    this.blurRadius = config.blurRadius
    this.blurStdDev = config.stdDeviation
    this.blendMaterial.userData.sigmoidRange.value = config.sigmoidRange
    this.blendMaterial.userData.sigmoidStrength.value = config.sigmoidStrength
    this.blendMaterial.needsUpdate = true
  }

  public setSize(width: number, height: number) {
    width
    height
  }
}
