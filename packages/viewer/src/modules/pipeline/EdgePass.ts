import {
  HalfFloatType,
  LinearFilter,
  Matrix4,
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
  private renderTarget: WebGLRenderTarget
  public edgesMaterial: ShaderMaterial
  private fsQuad: FullScreenQuad

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  public constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })

    this.edgesMaterial = new ShaderMaterial({
      fragmentShader: speckleEdgesGeneratorFrag,
      vertexShader: speckleEdgesGeneratorVert,
      uniforms: {
        tDepth: { value: null },
        tNormal: { value: null },
        size: { value: new Vector2(512, 512) },

        uDepthMultiplier: { value: 1 },
        uDepthBias: { value: 0.001 },
        uNormalMultiplier: { value: 1 },
        uNormalBias: { value: 1 },
        uOutlineThickness: { value: 1 },
        uOutlineDensity: { value: 0.5 },

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

  public update(_scene: Scene, camera: PerspectiveCamera | OrthographicCamera) {
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
