import {
  Box3,
  Camera,
  Intersection,
  Object3D,
  Ray,
  Scene,
  Vector2,
  Vector4
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { SpeckleRaycaster } from './objects/SpeckleRaycaster'
import Logger from 'js-logger'
import { ObjectLayers } from './SpeckleRenderer'

export class Intersections {
  private raycaster: SpeckleRaycaster
  private boxBuffer: Box3 = new Box3()
  private vec0Buffer: Vector4 = new Vector4()
  private vec1Buffer: Vector4 = new Vector4()

  public constructor() {
    this.raycaster = new SpeckleRaycaster()
    this.raycaster.params.Line = { threshold: 0.01 }
    ;(this.raycaster.params as { Line2? }).Line2 = {}
    ;(this.raycaster.params as { Line2? }).Line2.threshold = 1
    this.raycaster.onObjectIntersectionTest = this.onObjectIntersection.bind(this)
  }

  private onObjectIntersection(obj: Object3D) {
    if (obj instanceof LineSegments2) {
      const box = this.boxBuffer.setFromObject(obj)
      const min = this.vec0Buffer.set(box.min.x, box.min.y, box.min.z, 1)
      const max = this.vec1Buffer.set(box.max.y, box.max.y, box.max.z, 1)
      min
        .applyMatrix4(this.raycaster.camera.matrixWorldInverse)
        .applyMatrix4(this.raycaster.camera.projectionMatrix)
      max
        .applyMatrix4(this.raycaster.camera.matrixWorldInverse)
        .applyMatrix4(this.raycaster.camera.projectionMatrix)
      min
        .multiplyScalar(0.5)
        .multiplyScalar(1 / min.w)
        .addScalar(0.5)
      max
        .multiplyScalar(0.5)
        .multiplyScalar(1 / max.w)
        .addScalar(0.5)

      const ssDistance = new Vector2()
        .set(min.x, min.y)
        .distanceTo(new Vector2(max.x, max.y))

      const mat: LineMaterial = (obj as LineSegments2).material
      const lineWidth = mat.linewidth
      const worldSpace = mat.worldUnits
      /** So we empirically adjust the threshold of each line(batch) based on it's
       *  original line width and how zoomed in the camer is on the line(batch)
       */
      if (!worldSpace) {
        if (ssDistance < 1) {
          ;(this.raycaster.params as { Line2? }).Line2.threshold = lineWidth * 8
        } else {
          ;(this.raycaster.params as { Line2? }).Line2.threshold = lineWidth * 5
        }
      } else {
        if (ssDistance < 1) {
          ;(this.raycaster.params as { Line2? }).Line2.threshold = lineWidth * 2
        } else {
          ;(this.raycaster.params as { Line2? }).Line2.threshold = lineWidth
        }
      }
    }
  }

  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    nearest = true,
    bounds: Box3 = null,
    castLayers: Array<ObjectLayers> = undefined,
    firstOnly = false
  ): Array<Intersection> {
    this.raycaster.setFromCamera(point, camera)
    this.raycaster.firstHitOnly = firstOnly
    return this.intersectInternal(scene, nearest, bounds, castLayers)
  }

  public intersectRay(
    scene: Scene,
    camera: Camera,
    ray: Ray,
    nearest = true,
    bounds: Box3 = null,
    castLayers: Array<ObjectLayers> = undefined,
    firstOnly = false
  ): Array<Intersection> {
    this.raycaster.camera = camera
    this.raycaster.set(ray.origin, ray.direction)
    this.raycaster.firstHitOnly = firstOnly
    return this.intersectInternal(scene, nearest, bounds, castLayers)
  }

  private intersectInternal(
    scene: Scene,
    nearest: boolean,
    bounds: Box3,
    castLayers: Array<ObjectLayers>
  ) {
    const preserveMask = this.raycaster.layers.mask

    if (castLayers !== undefined) {
      this.raycaster.layers.disableAll()
      castLayers.forEach((layer) => {
        this.raycaster.layers.enable(layer)
      })
    }
    const target = scene.getObjectByName('ContentGroup')

    let results = []
    if (target) {
      const start = performance.now()
      results = this.raycaster.intersectObjects(target.children)
      Logger.warn('Interesct time -> ', performance.now() - start)
    }
    this.raycaster.layers.mask = preserveMask

    if (results.length === 0) return null
    if (nearest)
      results.sort((a, b) => {
        return a.distance - b.distance
      })
    if (bounds) {
      results = results.filter((result) => {
        return bounds.containsPoint(result.point)
      })
    }

    return results
  }
}
