import {
  CameraController,
  Extension,
  GeometryType,
  IViewer,
  MeshBatch,
  Vector3
} from '@speckle/viewer'
import { PerspectiveCamera } from 'three'

export class CameraPlanes extends Extension {
  private camerController: CameraController

  public constructor(viewer: IViewer) {
    super(viewer)
    this.camerController = viewer.getExtension(
      CameraController as new () => CameraController
    )
  }

  public onEarlyUpdate(): void {
    this.computePerspectiveCameraPlanes()
  }

  public computePerspectiveCameraPlanes() {
    const camera = this.viewer.getRenderer().renderingCamera as PerspectiveCamera
    const minDist = this.getClosestGeometryDistance(camera)
    if (minDist === Number.POSITIVE_INFINITY) return

    const fov = camera.fov
    const aspect = camera.aspect
    const nearPlane =
      Math.max(minDist, 0) /
      Math.sqrt(
        1 +
          Math.pow(Math.tan(((fov / 180) * Math.PI) / 2), 2) * (Math.pow(aspect, 2) + 1)
      )
    this.viewer.getRenderer().renderingCamera.near = nearPlane
    console.log(minDist, nearPlane)
  }

  public getClosestGeometryDistance(camera: PerspectiveCamera): number {
    const cameraPosition = camera.position
    const cameraTarget = this.camerController.controls.getTarget(new Vector3())
    const cameraDir = new Vector3()
      .subVectors(cameraTarget, camera.position)
      .normalize()

    const batches = this.viewer
      .getRenderer()
      .batcher.getBatches(undefined, GeometryType.MESH) as MeshBatch[]
    let minDist = Number.POSITIVE_INFINITY
    const minPoint = new Vector3()
    for (let b = 0; b < batches.length; b++) {
      const result = batches[b].mesh.TAS.closestPointToPoint(cameraPosition)
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
