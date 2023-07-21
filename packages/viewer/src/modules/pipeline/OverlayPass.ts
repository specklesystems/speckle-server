import { Camera, Scene, Texture } from 'three'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export class OverlayPass extends BaseSpecklePass implements SpecklePass {
  private camera: Camera
  private scene: Scene

  public onBeforeRender: () => void = null
  public onAfterRender: () => void = null

  public constructor() {
    super()
  }
  public get displayName(): string {
    return 'OVERLAY'
  }
  public get outputTexture(): Texture {
    return null
  }

  public update(scene: Scene, camera: Camera) {
    this.camera = camera
    this.scene = scene
  }

  render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {
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
