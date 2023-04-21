import { Camera, Color, Material, Scene, Texture } from 'three'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export class ColorPass extends BaseSpecklePass implements SpecklePass {
  private camera: Camera
  private scene: Scene
  private overrideMaterial: Material = null
  private _oldClearColor: Color = new Color()
  private clearColor: Color = null
  private clearAlpha = 0
  private clearDepth = true

  public onBeforeRenderOpauqe: () => void = null
  public onAfterRenderOpaque: () => void = null
  public onBeforeRenderTransparent: () => void = null
  public onAfterRenderTransparent: () => void = null

  public constructor() {
    super()
  }
  public get displayName(): string {
    return 'COLOR'
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

    let oldClearAlpha, oldOverrideMaterial

    if (this.overrideMaterial !== undefined) {
      oldOverrideMaterial = this.scene.overrideMaterial

      this.scene.overrideMaterial = this.overrideMaterial
    }

    if (this.clearColor) {
      renderer.getClearColor(this._oldClearColor)
      oldClearAlpha = renderer.getClearAlpha()

      renderer.setClearColor(this.clearColor, this.clearAlpha)
    }

    if (this.clearDepth) {
      renderer.clearDepth()
    }

    this.applyLayers(this.camera)

    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer)

    // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
    if (this.clear)
      renderer.clear(
        renderer.autoClearColor,
        renderer.autoClearDepth,
        renderer.autoClearStencil
      )
    if (this.onBeforeRenderOpauqe) this.onBeforeRenderOpauqe()
    renderer.render(this.scene, this.camera)
    if (this.onAfterRenderOpaque) this.onAfterRenderOpaque()
    if (this.onBeforeRenderTransparent) this.onBeforeRenderTransparent()
    renderer.render(this.scene, this.camera)
    if (this.onAfterRenderTransparent) this.onAfterRenderTransparent()

    if (this.clearColor) {
      renderer.setClearColor(this._oldClearColor, oldClearAlpha)
    }

    if (this.overrideMaterial !== undefined) {
      this.scene.overrideMaterial = oldOverrideMaterial
    }
    // if (shadowcatcher) shadowcatcher.visible = true
    renderer.autoClear = oldAutoClear
  }
}
