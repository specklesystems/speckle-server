import { Vector3, ICameraProvider, Extension, IViewer } from '@speckle/viewer'

export class RotateCamera extends Extension {
  get inject() {
    return [ICameraProvider.Symbol]
  }
  private polar = {
    azimuth: 0.001,
    polar: 0,
    radius: 100,
    origin: new Vector3()
  }

  public constructor(
    viewer: IViewer,
    private cameraController: ICameraProvider
  ) {
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
