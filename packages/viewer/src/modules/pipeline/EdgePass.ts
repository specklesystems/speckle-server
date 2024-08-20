import {
  Camera,
  Matrix4,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import {
  BaseSpecklePass,
  InputDepthTextureUniform,
  InputNormalsTextureUniform,
  type SpecklePass
} from './SpecklePass.js'
import { speckleEdgesGeneratorVert } from '../materials/shaders/speckle-edges-generator-vert.js'
import { speckleEdgesGeneratorFrag } from '../materials/shaders/speckle-edges-generator-frag.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

export class EdgePass extends BaseSpecklePass implements SpecklePass {
  private camera: Camera | null = null
  private scene: Scene | null = null
  private renderTarget: WebGLRenderTarget
  private edgesMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  public constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.edgesMaterial = new ShaderMaterial({
      fragmentShader: speckleEdgesGeneratorFrag,
      vertexShader: speckleEdgesGeneratorVert,
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        size: { value: new Vector2(512, 512) },

        cameraNear: { value: 1 },
        cameraFar: { value: 100 },
        cameraProjectionMatrix: { value: new Matrix4() },
        cameraInverseProjectionMatrix: { value: new Matrix4() }
      }
    })

    this.fsQuad = new FullScreenQuad(this.edgesMaterial)
  }

  public setTexture(
    uName: InputDepthTextureUniform | InputNormalsTextureUniform,
    texture: Texture
  ) {
    if (uName === 'tDepth') {
      this.edgesMaterial.uniforms['tDepth'].value = texture
    }
    if (uName === 'tNormal') {
      this.edgesMaterial.uniforms['tNormal'].value = texture
    }
    this.edgesMaterial.needsUpdate = true
  }

  public get displayName(): string {
    return 'EDGES'
  }
  public get outputTexture(): Texture {
    return this.renderTarget.texture
  }

  public update(scene: Scene, camera: PerspectiveCamera | OrthographicCamera) {
    this.camera = camera
    this.scene = scene
    this.edgesMaterial.defines['PERSPECTIVE_CAMERA'] = (camera as PerspectiveCamera)
      .isPerspectiveCamera
      ? 1
      : 0
    this.edgesMaterial.uniforms['cameraNear'].value = camera.near
    this.edgesMaterial.uniforms['cameraFar'].value = camera.far
  }

  render(renderer: WebGLRenderer) {
    renderer.setRenderTarget(this.renderTarget)

    if (this.onBeforeRender) this.onBeforeRender()
    this.fsQuad.render(renderer)
    if (this.onAfterRender) this.onAfterRender()
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
    this.edgesMaterial.uniforms['size'].value.set(width, height)
    this.edgesMaterial.needsUpdate = true
  }
}
