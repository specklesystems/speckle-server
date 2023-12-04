import {
  Camera,
  Color,
  DoubleSide,
  EqualStencilFunc,
  Material,
  Plane,
  Scene,
  Texture,
  Vector2,
  WebGLRenderer
} from 'three'
import SpeckleDisplaceMaterial from '../materials/SpeckleDisplaceMaterial'
import { BaseSpecklePass, SpecklePass } from './SpecklePass'

export class StencilMaskPass extends BaseSpecklePass implements SpecklePass {
  private camera: Camera
  private scene: Scene
  private overrideMaterial: Material = null
  private _oldClearColor: Color = new Color()
  private clearColor: Color = null
  private clearAlpha = 0
  private clearDepth = true
  private drawBufferSize: Vector2 = new Vector2()

  public onBeforeRender: () => void = null
  public onAfterRender: () => void = null

  public constructor() {
    super()
    this.overrideMaterial = new SpeckleDisplaceMaterial({ color: 0x04a5fb }, [
      'USE_RTE'
    ])
    this.overrideMaterial.userData.displacement.value = 2
    this.overrideMaterial.colorWrite = true
    this.overrideMaterial.depthWrite = false
    this.overrideMaterial.stencilWrite = true
    this.overrideMaterial.stencilFunc = EqualStencilFunc
    this.overrideMaterial.stencilRef = 0xff
    this.overrideMaterial.side = DoubleSide
  }
  public get displayName(): string {
    return 'STENCIL'
  }
  public get outputTexture(): Texture {
    return null
  }

  public get material(): Material {
    return this.overrideMaterial
  }

  public update(scene: Scene, camera: Camera) {
    this.camera = camera
    this.scene = scene
  }

  public setClippingPlanes(planes: Plane[]) {
    this.overrideMaterial.clippingPlanes = planes
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer,
    readBuffer /*, deltaTime, maskActive */
  ) {
    if (this.onBeforeRender) this.onBeforeRender()
    const oldAutoClear = renderer.autoClear
    renderer.autoClear = false

    let oldClearAlpha, oldOverrideMaterial

    if (this.overrideMaterial !== undefined) {
      oldOverrideMaterial = this.scene.overrideMaterial

      // this.scene.overrideMaterial = this.overrideMaterial
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
    renderer.getDrawingBufferSize(this.drawBufferSize)
    this.overrideMaterial.userData.size.value.copy(this.drawBufferSize)
    const shadowMapEnabled = renderer.shadowMap.enabled
    renderer.shadowMap.enabled = false
    renderer.render(this.scene, this.camera)
    renderer.shadowMap.enabled = shadowMapEnabled

    if (this.clearColor) {
      renderer.setClearColor(this._oldClearColor, oldClearAlpha)
    }

    if (this.overrideMaterial !== undefined) {
      this.scene.overrideMaterial = oldOverrideMaterial
    }
    renderer.autoClear = oldAutoClear
    if (this.onAfterRender) this.onAfterRender()
  }
}
