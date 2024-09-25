import { CameraController, Extension, GeometryType, IViewer } from '@speckle/viewer'
import { PerspectiveCamera, Vector3 } from 'three'

export class CameraPlanes extends Extension {
  private camerController: CameraController

  get enabled(): boolean {
    return this._enabled
  }
  set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer) {
    super(viewer)
    this.camerController = viewer.getExtension(CameraController)
  }

  public onEarlyUpdate(): void {
    this.computePerspectiveCameraPlanes()
  }

  public computePerspectiveCameraPlanes() {
    const renderer = this.viewer.getRenderer()
    if (!renderer.renderingCamera) return

    const camera = renderer.renderingCamera as PerspectiveCamera
    const start = performance.now()
    const minDist = this.getClosestGeometryDistance(camera)
    const end = performance.now()
    if (minDist === Number.POSITIVE_INFINITY) return

    const fov = camera.fov
    const aspect = camera.aspect
    const nearPlane =
      Math.max(minDist, 0) /
      Math.sqrt(
        1 +
          Math.pow(Math.tan(((fov / 180) * Math.PI) / 2), 2) * (Math.pow(aspect, 2) + 1)
      )
    renderer.renderingCamera.near = nearPlane
    console.log(minDist, nearPlane, end - start)
  }

  public getClosestGeometryDistance(camera: PerspectiveCamera): number {
    const cameraPosition = camera.position
    const cameraTarget = this.camerController.getTarget()
    const cameraDir = new Vector3()
      .subVectors(cameraTarget, camera.position)
      .normalize()

    const batches = this.viewer
      .getRenderer()
      .batcher.getBatches(undefined, GeometryType.MESH)
    let minDist = Number.POSITIVE_INFINITY
    const minPoint = new Vector3()
    for (let b = 0; b < batches.length; b++) {
      const result = batches[b].mesh.TAS.closestPointToPoint(cameraPosition)
      if (!result) continue

      const planarity = cameraDir.dot(
        new Vector3().subVectors(result.point, cameraPosition).normalize()
      )
      if (planarity > 0) {
        const dist = cameraPosition.distanceTo(result.point)
        if (dist < minDist) {
          minDist = dist
          minPoint.copy(result.point)
        }
      }
    }

    return minDist
  }
}
