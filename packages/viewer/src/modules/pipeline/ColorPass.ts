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
    // const shadowcatcher = this.scene.getObjectByName('Shadowcatcher')
    // if (shadowcatcher) shadowcatcher.visible = false
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
    renderer.render(this.scene, this.camera)

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
