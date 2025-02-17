import {
  Box3,
  Camera,
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
import {
  ExtendedIntersection,
  ExtendedMeshIntersection,
  SpeckleRaycaster
} from './objects/SpeckleRaycaster.js'
import { ObjectLayers } from '../IViewer.js'
import { World } from './World.js'

export class Intersections {
  protected raycaster: SpeckleRaycaster
  private boxBuffer: Box3 = new Box3()
  private vec0Buffer: Vector4 = new Vector4()
  private vec1Buffer: Vector4 = new Vector4()
  private boundsBuffer: Box3 = new Box3()

  public constructor() {
    this.raycaster = new SpeckleRaycaster()
    this.raycaster.params.Line = { threshold: 0.01 }
    this.raycaster.params.Points = { threshold: 0.01 }
    this.raycaster.params.Line2 = { threshold: 1 }
    this.raycaster.onObjectIntersectionTest = this.onObjectIntersection.bind(this)
  }

  protected onObjectIntersection(obj: Object3D) {
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

      const mat: LineMaterial = obj.material
      const lineWidth = mat.linewidth
      const worldSpace = mat.worldUnits
      /** So we empirically adjust the threshold of each line(batch) based on it's
       *  original line width and how zoomed in the camer is on the line(batch)
       */
      if (!worldSpace) {
        this.raycaster.params.Line2.threshold =
          ssDistance < 1 ? lineWidth * 8 : lineWidth * 5
      } else {
        this.raycaster.params.Line2.threshold =
          ssDistance < 1 ? lineWidth * 2 : lineWidth
      }
    }
  }

  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    castLayers: ObjectLayers.STREAM_CONTENT_MESH,
    nearest?: boolean,
    bounds?: Box3,
    firstOnly?: boolean,
    tasOnly?: boolean
  ): Array<ExtendedMeshIntersection> | null
  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    castLayers?: Array<ObjectLayers>,
    nearest?: boolean,
    bounds?: Box3,
    firstOnly?: boolean,
    tasOnly?: boolean
  ): Array<ExtendedIntersection> | null

  public intersect(
    scene: Scene,
    camera: Camera,
    point: Vector2,
    castLayers: Array<ObjectLayers> | ObjectLayers | undefined = undefined,
    nearest = true,
    bounds?: Box3,
    firstOnly = false,
    tasOnly = false
  ): Array<ExtendedMeshIntersection> | Array<ExtendedIntersection> | null {
    this.raycaster.setFromCamera(point, camera)
    this.raycaster.firstHitOnly = firstOnly
    this.raycaster.intersectTASOnly = tasOnly
    const preserveMask = this.setRaycasterLayers(castLayers)
    let result: Array<ExtendedMeshIntersection> | Array<ExtendedIntersection> | null
    if (castLayers === ObjectLayers.STREAM_CONTENT_MESH) {
      result = this.intersectInternal<ExtendedMeshIntersection>(scene, nearest, bounds)
    } else result = this.intersectInternal<ExtendedIntersection>(scene, nearest, bounds)
    this.raycaster.layers.mask = preserveMask
    return result
  }

  public intersectRay(
    scene: Scene,
    camera: Camera,
    ray: Ray,
    castLayers: ObjectLayers.STREAM_CONTENT_MESH,
    nearest?: boolean,
    bounds?: Box3,
    firstOnly?: boolean,
    tasOnly?: boolean
  ): Array<ExtendedMeshIntersection> | null
  public intersectRay(
    scene: Scene,
    camera: Camera,
    ray: Ray,
    castLayers?: Array<ObjectLayers>,
    nearest?: boolean,
    bounds?: Box3,
    firstOnly?: boolean,
    tasOnly?: boolean
  ): Array<ExtendedIntersection> | null

  public intersectRay(
    scene: Scene,
    camera: Camera,
    ray: Ray,
    castLayers: Array<ObjectLayers> | ObjectLayers | undefined = undefined,
    nearest = true,
    bounds?: Box3,
    firstOnly = false,
    tasOnly = false
  ): Array<ExtendedMeshIntersection> | Array<ExtendedIntersection> | null {
    this.raycaster.camera = camera
    this.raycaster.set(ray.origin, ray.direction)
    this.raycaster.firstHitOnly = firstOnly
    this.raycaster.intersectTASOnly = tasOnly
    const preserveMask = this.setRaycasterLayers(castLayers)
    let result: Array<ExtendedMeshIntersection> | Array<ExtendedIntersection> | null
    if (castLayers === ObjectLayers.STREAM_CONTENT_MESH) {
      result = this.intersectInternal<ExtendedMeshIntersection>(scene, nearest, bounds)
    } else result = this.intersectInternal<ExtendedIntersection>(scene, nearest, bounds)
    this.raycaster.layers.mask = preserveMask
    return result
  }

  private setRaycasterLayers(
    castLayers: Array<ObjectLayers> | ObjectLayers | undefined
  ): number {
    const preserveMask = this.raycaster.layers.mask
    if (castLayers !== undefined) {
      this.raycaster.layers.disableAll()
      if (Array.isArray(castLayers))
        castLayers.forEach((layer) => {
          this.raycaster.layers.enable(layer)
        })
      else {
        this.raycaster.layers.enable(castLayers)
      }
    }
    return preserveMask
  }

  private intersectInternal<T extends ExtendedIntersection>(
    scene: Scene,
    nearest?: boolean,
    bounds?: Box3
  ): T[] | null {
    let results: T[] | null = []
    const target = scene.getObjectByName('ContentGroup')

    if (target) {
      // const start = performance.now()
      results = this.raycaster.intersectObjects(target.children)
      // Logger.warn('Interesct time -> ', performance.now() - start)
    }

    if (results.length === 0) return null
    if (nearest)
      results.sort((a, b) => {
        return a.distance - b.distance
      })
    if (bounds) {
      /** We slightly increase the tested bounds to account for fp precision issues which
       *  have proven to arise exactly at the edge of the bounds. Our BVH returns intersection
       *  points ever so slightly off the actual surface, so for very thin geometries it might
       *  fall outside of the bounds
       */
      this.boundsBuffer.copy(World.expandBoxRelative(bounds))

      results = results.filter((result) => {
        return (
          this.boundsBuffer.containsPoint(result.point) ||
          (result.pointOnLine
            ? this.boundsBuffer.containsPoint(result.pointOnLine)
            : false)
        )
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
