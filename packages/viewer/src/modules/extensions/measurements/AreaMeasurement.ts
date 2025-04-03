import {
  Box3,
  Camera,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'
import { getConversionFactor } from '../../converter/Units.js'

export class AreaMeasurement extends Measurement {
  private pointGizmos: MeasurementPointGizmo[]
  private pointIndex: number = 0
  private surfacePoint: Vector3 = new Vector3()
  private surfaceNormal: Vector3 = new Vector3()
  private planeOrigin: Vector3 = new Vector3()
  private planeNormal: Vector3 = new Vector3()
  private points: Vector3[] = []
  private measuredPoints: Vector3[] = []

  private planeMesh: Mesh
  private fillMesh: Mesh

  public set isVisible(value: boolean) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.enable(value, value, value, value)
    })
  }

  public constructor() {
    super()
    this.type = 'AreaMeasurement'
    this.pointGizmos = []
    const gizmo = new MeasurementPointGizmo()
    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(this.pointGizmos[0])
    this.layers.set(ObjectLayers.MEASUREMENTS)

    const planeGeometry = new PlaneGeometry(1, 1)
    this.planeMesh = new Mesh(
      planeGeometry,
      new MeshBasicMaterial({
        color: 0xffff00,
        side: DoubleSide,
        opacity: 0.5,
        transparent: true
      })
    )
    this.planeMesh.layers.set(ObjectLayers.MEASUREMENTS)
    this.add(this.planeMesh)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.frameUpdate(camera, bounds)
    })
  }

  private updateFillPlane() {
    if (!this.fillMesh) {
      this.fillMesh = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial({
          color: 0xff0000,
          side: DoubleSide,
          opacity: 0.5,
          transparent: true
        })
      )
      this.fillMesh.layers.set(ObjectLayers.MEASUREMENTS)
      this.add(this.fillMesh)
    }
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1),
      this.planeNormal
    )

    const box = new Box3().setFromPoints(this.points)
    box.getCenter(this.fillMesh.position)
    const mat = new Matrix4()
      .setPosition(this.fillMesh.position)
      .multiply(new Matrix4().makeRotationFromQuaternion(quaternion))
    box.applyMatrix4(mat)
    box.getSize(this.fillMesh.scale)
    this.fillMesh.quaternion.copy(quaternion)
  }

  public locationUpdated(point: Vector3, normal: Vector3) {
    this.surfacePoint.copy(point)
    this.surfaceNormal.copy(normal)

    this.planeMesh.position.copy(this.surfacePoint)
    this.planeMesh.quaternion.copy(
      new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), this.surfaceNormal)
    )
  }

  public locationSelected() {
    if (this.pointIndex === 0) {
      this.planeOrigin.copy(this.surfacePoint)
      this.planeNormal.copy(this.surfaceNormal)
    }

    const measuredPoint = new Vector3().copy(this.surfacePoint)
    if (this.pointIndex > 0) {
      measuredPoint.copy(
        this.projectOnPlane(this.surfacePoint, this.planeOrigin, this.planeNormal)
      )
      const distanceToFirst = this.measuredPoints[0].distanceTo(measuredPoint)
      if (distanceToFirst < 0.1) {
        this._state = MeasurementState.COMPLETE
        measuredPoint.copy(this.measuredPoints[0])
        this.surfacePoint.copy(this.points[0])
      }
    }

    const gizmo = new MeasurementPointGizmo()
    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(gizmo)

    this.points.push(this.surfacePoint.clone())
    this.measuredPoints.push(measuredPoint)
    this.pointIndex++

    void this.update()
    if (this.points.length > 2) this.updateFillPlane()

    console.warn('Area -> ', this.shoelaceArea3D(this.measuredPoints, this.planeNormal))
  }

  public update(): Promise<void> {
    let ret: Promise<void> = Promise.resolve()

    if (this.pointIndex === 0) {
      this.pointGizmos[this.pointIndex].updateDisc(
        this.surfacePoint,
        this.surfaceNormal
      )
      this.pointGizmos[this.pointIndex].updatePoint(this.surfacePoint)
    } else {
      const currentPoint = this.surfacePoint
      const prevPoint = this.points[this.pointIndex - 1]
      this.startLineLength = currentPoint.distanceTo(prevPoint)
      this.value = this.startLineLength

      const endStartDir = Measurement.vec3Buff0
        .copy(currentPoint)
        .sub(prevPoint)
        .normalize()
      const lineEndPoint = Measurement.vec3Buff1
        .copy(prevPoint)
        .add(
          Measurement.vec3Buff2.copy(endStartDir).multiplyScalar(this.startLineLength)
        )

      this.pointGizmos[this.pointIndex].updateLine([prevPoint, lineEndPoint])
      this.pointGizmos[this.pointIndex].updatePoint(lineEndPoint)
      if (this.fillMesh) {
        this.value = this.shoelaceArea3D(this.measuredPoints, this.planeNormal)
        ret = this.pointGizmos[0].updateText(
          `${(
            this.shoelaceArea3D(this.measuredPoints, this.planeNormal) *
            getConversionFactor('m', this.units)
          ).toFixed(this.precision)} ${this.units}²`,
          this.fillMesh.position
        )
        this.pointGizmos[0].enable(false, true, true, true)
      }
      this.pointGizmos[this.pointIndex].enable(false, true, true, false)
    }

    if (this._state === MeasurementState.COMPLETE) {
      this.pointGizmos[this.pointIndex].enable(false, false, false, false)
      this.planeMesh.visible = false
    }

    return ret
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const results: Array<Intersection> = []
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.raycast(raycaster, results)
    })
    if (results.length) {
      intersects.push({
        distance: results[0].distance,
        face: results[0].face,
        faceIndex: results[0].faceIndex,
        object: this,
        point: results[0].point,
        uv: results[0].uv
      })
    }
  }

  public highlight(value: boolean) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.highlight = value
    })
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.updateClippingPlanes(planes)
    })
  }

  private chooseProjectionAxes(normal: Vector3) {
    const absNormal = normal
      .clone()
      .set(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z))

    if (absNormal.z >= absNormal.x && absNormal.z >= absNormal.y) {
      return ['x', 'y'] // Project to XY plane
    } else if (absNormal.y >= absNormal.x && absNormal.y >= absNormal.z) {
      return ['x', 'z'] // Project to XZ plane
    } else {
      return ['y', 'z'] // Project to YZ plane
    }
  }

  private shoelaceArea(points: Vector2[]) {
    const n = points.length
    if (n < 3) return 0 // At least 3 points needed for a polygon

    let area = 0
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n // Wrap around for the last point
      area += points[i].x * points[j].y - points[j].x * points[i].y
    }

    return Math.abs(area) / 2
  }

  private shoelaceArea3D(points: Vector3[], normal: Vector3) {
    const [axis1, axis2] = this.chooseProjectionAxes(normal)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const projectedPoints = points.map((p) => new Vector2(p[axis1], p[axis2]))

    return this.shoelaceArea(projectedPoints)
  }

  private projectOnPlane(point: Vector3, planeOrigin: Vector3, planeNormal: Vector3) {
    const p = new Vector3().copy(point)
    const o = new Vector3().copy(planeOrigin)
    const n = new Vector3().copy(planeNormal).normalize()

    const v = p.sub(o)
    const dist = v.dot(n)
    return new Vector3().copy(point).sub(n.multiplyScalar(dist))
  }
}
