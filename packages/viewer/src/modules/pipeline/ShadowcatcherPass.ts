import {
  Box3,
  Color,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  RepeatWrapping,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader'
import {
  BlurShaderUtils,
  DepthLimitedBlurShader
} from 'three/examples/jsm/shaders/DepthLimitedBlurShader'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export class ShadowcatcherPass extends BaseSpecklePass implements SpecklePass {
  private renderTarget: WebGLRenderTarget
  private scaledRenderTarget: WebGLRenderTarget
  private blurIntermediateRenderTarget: WebGLRenderTarget = null
  private depthRenderTarget: WebGLRenderTarget
  public camera: OrthographicCamera = null
  private scene: Scene = null
  private _needsUpdate = false

  private fsQuad: FullScreenQuad = null
  private overrideMaterial: MeshBasicMaterial = null
  private depthMaterial: MeshDepthMaterial = null
  private vBlurMaterial: ShaderMaterial = null
  private hBlurMaterial: ShaderMaterial = null
  private copyMaterial: ShaderMaterial = null
  public blurStdDev = 4
  public blurRadius = 16
  private prevBlurStdDev = 0
  private prevBlurRadius = 0
  public cameraFar = 10
  public depthCutoff = 0
  private cameraHelper = null

  public onBeforeRender: () => void = null
  public onAfterRender: () => void = null

  get displayName(): string {
    return 'Shadowcatcher'
  }

  get outputTexture(): Texture {
    return this.renderTarget.texture
  }

  set needsUpdate(value: boolean) {
    this._needsUpdate = value
  }

  constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.scaledRenderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.blurIntermediateRenderTarget = new WebGLRenderTarget(256, 256)
    this.depthRenderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    this.depthRenderTarget.depthBuffer = true
    this.depthRenderTarget.stencilBuffer = true

    this.camera = new OrthographicCamera(256 / -2, 256 / 2, 256 / 2, 256 / -2, 0, 10)

    this.vBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.vBlurMaterial.defines['DEPTH_PACKING'] = 1

    this.vBlurMaterial.uniforms['tDiffuse'].value = this.renderTarget.texture
    // this.vBlurMaterial.uniforms['tDepth'].value = this.depthRenderTarget.texture
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
    // this.hBlurMaterial.uniforms['tDepth'].value = this.depthRenderTarget.texture
    this.hBlurMaterial.uniforms['size'].value.set(256, 256)
    this.hBlurMaterial.blending = NoBlending

    this.overrideMaterial = new MeshBasicMaterial({ color: 0xffffff })
    this.overrideMaterial.toneMapped = false
    this.overrideMaterial.vertexColors = false
    this.overrideMaterial.side = DoubleSide

    this.depthMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking
    })
    this.depthMaterial.blending = NoBlending
    this.depthMaterial.side = DoubleSide

    this.copyMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      defines: {},
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader
    })
    this.copyMaterial.uniforms['tDiffuse'].value = this.renderTarget.texture
    this.renderTarget.texture.wrapS = RepeatWrapping
    this.renderTarget.texture.wrapT = RepeatWrapping

    this.fsQuad = new FullScreenQuad(this.vBlurMaterial)
  }

  public update(scene: Scene) {
    this.scene = scene
    if (this._needsUpdate) {
      const plane: Mesh = this.scene.getObjectByName('Shadowcatcher') as Mesh
      const planeBox = new Box3().setFromObject(plane)
      const planeSize = planeBox.getSize(new Vector3())
      const planeCenter = planeBox.getCenter(new Vector3())
      this.camera.position.copy(
        new Vector3().copy(planeCenter).add(new Vector3(0, 0, -1))
      )
      this.camera.lookAt(planeCenter)
      this.camera.left = planeSize.x / -2
      this.camera.right = planeSize.x / 2
      this.camera.top = planeSize.y / 2
      this.camera.bottom = planeSize.y / -2
      this.camera.far = this.cameraFar
      this.camera.updateProjectionMatrix()
      // if (this.cameraHelper === null) {
      //   const cameraHelper = new CameraHelper(this.camera)
      //   cameraHelper.layers.set(ObjectLayers.PROPS)
      //   this.scene.add(cameraHelper)
      // }

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
      const depthCutoff = this.depthCutoff
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

      // this.depthMaterial.userData.near.value = (
      //   this.camera as PerspectiveCamera | OrthographicCamera
      // ).near
      // this.depthMaterial.userData.far.value = (
      //   this.camera as PerspectiveCamera | OrthographicCamera
      // ).far
      // this.depthMaterial.needsUpdate = true
    }
  }

  public render(renderer, writeBuffer, readBuffer) {
    writeBuffer
    readBuffer
    if (this._needsUpdate) {
      const colorBuffer = new Color()
      renderer.getClearColor(colorBuffer)
      const originalClearAlpha = renderer.getClearAlpha()
      const originalAutoClear = renderer.autoClear

      this.onBeforeRender()
      renderer.setRenderTarget(this.renderTarget)
      this.applyLayers(this.camera)
      this.scene.overrideMaterial = this.overrideMaterial
      renderer.setClearColor(0x000000)
      renderer.setClearAlpha(1)
      renderer.render(this.scene, this.camera)
      this.scene.overrideMaterial = null

      // renderer.setRenderTarget(this.scaledRenderTarget)
      // renderer.setClearColor(0x000000)
      // renderer.setClearAlpha(1.0)
      // this.fsQuad.material = this.copyMaterial
      // this.fsQuad.render(renderer)

      // renderer.setRenderTarget(this.depthRenderTarget)
      // this.scene.overrideMaterial = this.depthMaterial
      // renderer.render(this.scene, this.camera)
      // this.scene.overrideMaterial = null

      renderer.setRenderTarget(this.blurIntermediateRenderTarget)
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1.0)
      renderer.clear()
      this.fsQuad.material = this.vBlurMaterial
      this.fsQuad.render(renderer)

      renderer.setRenderTarget(this.renderTarget)
      this.fsQuad.material = this.hBlurMaterial
      this.fsQuad.render(renderer)

      renderer.setRenderTarget(null)
      renderer.autoClear = originalAutoClear
      renderer.setClearColor(colorBuffer)
      renderer.setClearAlpha(originalClearAlpha)

      this.onAfterRender()
      // this._needsUpdate = false
    }
  }

  public setOutputSize(width: number, height: number) {
    if (this.renderTarget.width !== width || this.renderTarget.height !== height) {
      this.renderTarget.setSize(Math.trunc(width), Math.trunc(height))
      this.blurIntermediateRenderTarget.setSize(width, height)
      this.depthRenderTarget.setSize(width, height)
      const aspect = width / height
      this.scaledRenderTarget.setSize(Math.trunc(64), Math.trunc(64 / aspect))

      this.vBlurMaterial.uniforms['size'].value.set(
        Math.trunc(64),
        Math.trunc(64 / aspect)
      )
      this.hBlurMaterial.uniforms['size'].value.set(
        Math.trunc(64),
        Math.trunc(64 / aspect)
      )
    }
  }

  public setSize(width: number, height: number) {
    width
    height
  }
}
