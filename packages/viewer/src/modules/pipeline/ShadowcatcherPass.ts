import {
  Box3,
  Camera,
  CameraHelper,
  Color,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderTarget
} from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import {
  BlurShaderUtils,
  DepthLimitedBlurShader
} from 'three/examples/jsm/shaders/DepthLimitedBlurShader'
import { ObjectLayers } from '../SpeckleRenderer'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export enum DepthType {
  PERSPECTIVE_DEPTH,
  LINEAR_DEPTH
}

export enum DepthSize {
  FULL,
  HALF
}

export class ShadowcatcherPass extends BaseSpecklePass implements SpecklePass {
  private renderTarget: WebGLRenderTarget
  private blurIntermediateRenderTarget: WebGLRenderTarget = null
  private camera: OrthographicCamera = null
  private scene: Scene = null
  private _needsUpdate = false

  private fsQuad: FullScreenQuad = null
  private vBlurMaterial: ShaderMaterial = null
  private hBlurMaterial: ShaderMaterial = null
  private prevStdDev: number
  private prevNumSamples: number

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
    this.blurIntermediateRenderTarget = new WebGLRenderTarget(256, 256)
    this.camera = new OrthographicCamera(256 / -2, 256 / 2, 256 / 2, 256 / -2, 0, 10)

    this.vBlurMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.clone(DepthLimitedBlurShader.uniforms),
      defines: Object.assign({}, DepthLimitedBlurShader.defines),
      vertexShader: DepthLimitedBlurShader.vertexShader,
      fragmentShader: DepthLimitedBlurShader.fragmentShader
    })
    this.vBlurMaterial.defines['DEPTH_PACKING'] = 1

    this.vBlurMaterial.uniforms['tDiffuse'].value = this.renderTarget.texture
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

    this.fsQuad = new FullScreenQuad(this.vBlurMaterial)
  }

  public update(scene: Scene, camera: Camera) {
    camera
    this.scene = scene
    if (this._needsUpdate) {
      const plane: Mesh = this.scene.getObjectByName('Shadowcatcher') as Mesh
      const planeBox = new Box3().setFromObject(plane)
      const planeSize = planeBox.getSize(new Vector3())
      const planeCenter = planeBox.getCenter(new Vector3())
      this.camera.position.copy(
        new Vector3().copy(planeCenter).add(new Vector3(0, 0, 1))
      )
      this.camera.lookAt(planeCenter)
      this.camera.left = planeSize.x / -2
      this.camera.right = planeSize.x / 2
      this.camera.top = planeSize.y / 2
      this.camera.bottom = planeSize.y / -2
      this.camera.updateProjectionMatrix()
      const cameraHelper = new CameraHelper(this.camera)
      cameraHelper.layers.set(ObjectLayers.PROPS)
      // this.scene.add(cameraHelper)

      /** BLUR DEFINES */
      this.vBlurMaterial.defines['PERSPECTIVE_CAMERA'] = 0
      this.hBlurMaterial.defines['PERSPECTIVE_CAMERA'] = 0

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
      const depthCutoff = 0
      // this.params.blurDepthCutoff *
      // ((camera as PerspectiveCamera | OrthographicCamera).far -
      //   (camera as PerspectiveCamera | OrthographicCamera).near)
      this.vBlurMaterial.uniforms['depthCutoff'].value = depthCutoff
      this.hBlurMaterial.uniforms['depthCutoff'].value = depthCutoff

      const blurRadius = 16
      const blurStdDev = 4

      BlurShaderUtils.configure(
        this.vBlurMaterial,
        blurRadius,
        blurStdDev,
        new Vector2(0, 1)
      )
      BlurShaderUtils.configure(
        this.hBlurMaterial,
        blurRadius,
        blurStdDev,
        new Vector2(1, 0)
      )

      this.vBlurMaterial.needsUpdate = true
      this.hBlurMaterial.needsUpdate = true
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
      renderer.render(this.scene, this.camera)

      renderer.setRenderTarget(this.blurIntermediateRenderTarget)
      renderer.setClearColor(0xffffff)
      renderer.setClearAlpha(1.0)
      renderer.clear()
      this.fsQuad.material = this.vBlurMaterial
      this.fsQuad.render(renderer)

      renderer.setRenderTarget(this.renderTarget)
      this.fsQuad.material = this.hBlurMaterial
      this.fsQuad.render(renderer)

      renderer.autoClear = originalAutoClear
      renderer.setClearColor(colorBuffer)
      renderer.setClearAlpha(originalClearAlpha)

      this.onAfterRender()
    }
  }

  public setOutputSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
    this.blurIntermediateRenderTarget.setSize(width, height)

    this.vBlurMaterial.uniforms['size'].value.set(width, height)
    this.hBlurMaterial.uniforms['size'].value.set(width, height)
  }

  public setSize(width: number, height: number) {
    width
    height
  }
}
