import {
  Camera,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { BaseSpecklePass, type SpecklePass } from './SpecklePass'

export class OverlayPass extends BaseSpecklePass implements SpecklePass {
  private camera!: Camera
  private scene!: Scene

  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  public constructor() {
    super()
  }
  public get displayName(): string {
    return 'OVERLAY'
  }
  public get outputTexture(): Texture | null {
    return null
  }

  public update(scene: Scene, camera: PerspectiveCamera | OrthographicCamera) {
    this.camera = camera
    this.scene = scene
  }

  render(
    renderer: WebGLRenderer,
    _writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    const oldAutoClear = renderer.autoClear
    renderer.autoClear = false
    this.applyLayers(this.camera)
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer)
    if (this.onBeforeRender) this.onBeforeRender()
    renderer.render(this.scene, this.camera)
    if (this.onAfterRender) this.onAfterRender()
    renderer.autoClear = oldAutoClear
  }
}
