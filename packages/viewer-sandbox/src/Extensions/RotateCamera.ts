import { Extension, IViewer, CameraController } from '@speckle/viewer'
import { Vector3 } from 'three'

export class RotateCamera extends Extension {
  get inject() {
    return [CameraController]
  }
  private polar = {
    azimuth: 0.001,
    polar: 0,
    radius: 100,
    origin: new Vector3()
  }

  get enabled(): boolean {
    return this._enabled
  }
  set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer, private cameraController: CameraController) {
    super(viewer)
  }

  public onUpdate(deltaTime: number) {
    deltaTime
    this.cameraController.setCameraView(this.polar, false)
  }
  public onRender() {
    // NOT IMPLEMENTED
  }
  public onResize() {
    // NOT IMPLEMENTED
  }
}
