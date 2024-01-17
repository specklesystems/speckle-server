import {
  Box3,
  Camera,
  Intersection,
  Object3D,
  Plane,
  Ray,
  Scene,
  Vector2,
  Vector3,
  Vector4
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { SpeckleRaycaster } from './objects/SpeckleRaycaster'
import { ObjectLayers } from '../IViewer'

export class Intersections {
  private raycaster: SpeckleRaycaster
  private boxBuffer: Box3 = new Box3()
  private vec0Buffer: Vector4 = new Vector4()
  private vec1Buffer: Vector4 = new Vector4()
  private boundsBuffer: Box3 = new Box3()

  public constructor() {
    this.raycaster = new SpeckleRaycaster()
    this.raycaster.params.Line = { threshold: 0.01 }
    this.raycaster.params.Points = { threshold: 0.01 }
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
      // const start = performance.now()
      results = this.raycaster.intersectObjects(target.children)
      // Logger.warn('Interesct time -> ', performance.now() - start)
    }
    this.raycaster.layers.mask = preserveMask

    if (results.length === 0) return null
    if (nearest)
      results.sort((a, b) => {
        return a.distance - b.distance
      })
    if (bounds) {
      this.boundsBuffer.copy(bounds)
      /** We slightly increase the tested bounds to account for fp precision issues which
       *  have proven to arise exactly at the edge of the bounds
       */
      this.boundsBuffer.expandByVector(
        new Vector3(
          0.0001 * (this.boundsBuffer.max.x - this.boundsBuffer.min.x),
          0.0001 * (this.boundsBuffer.max.y - this.boundsBuffer.min.y),
          0.0001 * (this.boundsBuffer.max.z - this.boundsBuffer.min.z)
        )
      )
      results = results.filter((result) => {
        return this.boundsBuffer.containsPoint(result.point)
      })
    }

    return results
  }

  public static aabbPlanePoints = (plane: Plane, aabb: Box3) => {
    const ray = new Ray()
    const outPoints = new Array<Vector3>()
    // Test edges along X axis, pointing right.
    const dir: Vector3 = new Vector3(aabb.max.x - aabb.min.x, 0, 0)
    const orig: Vector3 = new Vector3().copy(aabb.min)
    ray.set(orig, dir)
    let t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    orig.set(aabb.min.x, aabb.max.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    orig.set(aabb.min.x, aabb.min.y, aabb.max.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    orig.set(aabb.min.x, aabb.max.y, aabb.max.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    // Test edges along Y axis, pointing up.
    dir.set(0, aabb.max.y - aabb.min.y, 0)
    orig.set(aabb.min.x, aabb.min.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    orig.set(aabb.max.x, aabb.min.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }
    orig.set(aabb.min.x, aabb.min.y, aabb.max.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    orig.set(aabb.max.x, aabb.min.y, aabb.max.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    // Test edges along Z axis, pointing forward.
    dir.set(0, 0, aabb.max.z - aabb.min.z)
    orig.set(aabb.min.x, aabb.min.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }
    orig.set(aabb.max.x, aabb.min.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }
    orig.set(aabb.min.x, aabb.max.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }
    orig.set(aabb.max.x, aabb.max.y, aabb.min.z)
    ray.set(orig, dir)
    t = ray.distanceToPlane(plane)
    if (t) {
      outPoints.push(new Vector3().copy(orig).addScaledVector(dir, t))
    }

    return outPoints
  }
}
