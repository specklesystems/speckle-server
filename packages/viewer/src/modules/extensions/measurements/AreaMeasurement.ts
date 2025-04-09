import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Camera,
  DoubleSide,
  DynamicDrawUsage,
  Material,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'
import { getConversionFactor } from '../../converter/Units.js'
import { Geometry } from '../../converter/Geometry.js'
import polylabel from 'polylabel'
import SpeckleBasicMaterial from '../../materials/SpeckleBasicMaterial.js'
import { MeasurementPointGizmo2 } from './MeasurementPointGizmo2.js'
import { ExtendedMeshIntersection } from '../../objects/SpeckleRaycaster.js'

const _vec30 = new Vector3()
const _vec31 = new Vector3()
const _vec32 = new Vector3()

export class AreaMeasurement extends Measurement {
  private pointGizmos: MeasurementPointGizmo2[]
  private pointIndex: number = 0
  private surfacePoint: Vector3 = new Vector3()
  private surfaceNormal: Vector3 = new Vector3()
  private planeOrigin: Vector3 = new Vector3()
  private planeNormal: Vector3 = new Vector3()
  private labelPoint: Vector3 = new Vector3()
  private points: Vector3[] = []
  private measuredPoints: Vector3[] = []
  private polygonPoints: Vector3[] = []

  private fillPolygon: Mesh
  private snapDistance: number = 10

  public set isVisible(value: boolean) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo2) => {
      gizmo.enable(value, value, value, value)
    })
  }

  public constructor() {
    super()
    this.type = 'AreaMeasurement'
    this.pointGizmos = []
    const gizmo = new MeasurementPointGizmo2()
    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(this.pointGizmos[0])
    this.layers.set(ObjectLayers.MEASUREMENTS)

    this.polygonPoints.push(new Vector3())
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo2) => {
      gizmo.frameUpdate(camera, size)
    })
  }

  public locationUpdated(point: Vector3, normal: Vector3) {
    this.surfacePoint.copy(point)
    this.surfaceNormal.copy(normal)

    this.projectOnPlane(
      this.surfacePoint,
      this.planeOrigin,
      this.planeNormal,
      this.polygonPoints[0]
    )

    this.updateFillPolygon(this.polygonPoints)
  }

  public locationSelected() {
    if (this.pointIndex === 0) {
      this.planeOrigin.copy(this.surfacePoint)
      this.planeNormal.copy(this.surfaceNormal)
    }

    this.addPoint()
  }

  public addPoint(): number {
    const measuredPoint = new Vector3().copy(this.surfacePoint)
    if (this.pointIndex > 0) {
      measuredPoint.copy(
        this.projectOnPlane(this.surfacePoint, this.planeOrigin, this.planeNormal)
      )
      const distanceToFirst = this.surfacePoint.distanceTo(this.points[0])
      if (distanceToFirst < 1e-10) {
        this._state = MeasurementState.DANGLING_END
        measuredPoint.copy(this.measuredPoints[0])
        this.surfacePoint.copy(this.points[0])
      }
    }

    const gizmo = new MeasurementPointGizmo2()
    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(gizmo)

    this.points.push(this.surfacePoint.clone())
    this.measuredPoints.push(measuredPoint)
    this.polygonPoints.push(measuredPoint)
    this.pointIndex++

    void this.update()

    if (this.points.length >= 2) {
      this.projectOnPlane(
        this.surfacePoint,
        this.planeOrigin,
        this.planeNormal,
        this.polygonPoints[0]
      )
      this.updateFillPolygon(this.polygonPoints)
      this.updatePoleOfInnacessibility(this.measuredPoints)
    }

    return this.points.length
  }

  public removePoint(): number {
    if (this.pointIndex < 1) return 0
    this.remove(this.pointGizmos.pop() as MeasurementPointGizmo2)
    this.points.pop()
    this.measuredPoints.pop()
    this.polygonPoints.pop()
    this.pointIndex--

    void this.update()
    this.updateFillPolygon(this.polygonPoints)
    this.updatePoleOfInnacessibility(this.measuredPoints)

    return this.points.length
  }

  public autoFinish() {
    this.surfacePoint.copy(this.planeOrigin)
    this.surfaceNormal.copy(this.planeNormal)
    this.locationSelected()
  }

  public snap(
    ndcPoint: Vector2,
    _intersection: ExtendedMeshIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ): boolean {
    if (this.pointIndex < 2) return false

    const firstPointSS = new Vector3()
      .copy(this.points[0])
      .project(this.renderingCamera as PerspectiveCamera | OrthographicCamera)
    firstPointSS.set(
      (firstPointSS.x * 0.5 + 0.5) * this.renderingSize.x,
      (firstPointSS.y * -0.5 + 0.5) * this.renderingSize.y,
      0
    )
    const mousePointSS = new Vector3(
      (ndcPoint.x * 0.5 + 0.5) * this.renderingSize.x,
      (ndcPoint.y * -0.5 + 0.5) * this.renderingSize.y,
      0
    )
    const SSDistance = firstPointSS.distanceTo(mousePointSS)

    if (SSDistance < this.snapDistance * window.devicePixelRatio) {
      outPoint.copy(this.points[0])
      outNormal.copy(this.planeNormal)
      return true
    }

    return false
  }

  public update(): Promise<void> {
    let ret: Promise<void> = Promise.resolve()

    this.pointGizmos[this.pointIndex].updateNormalIndicator(
      this.surfacePoint,
      this.surfaceNormal
    )
    this.pointGizmos[this.pointIndex].updatePoint(this.surfacePoint)

    if (this.pointIndex === 0) {
      this.pointGizmos[this.pointIndex].enable(true, true, true, false)
      return ret
    }

    const currentPoint = this.surfacePoint
    const prevPoint = this.points[this.pointIndex - 1]
    this.pointGizmos[this.pointIndex].updateLine([prevPoint, currentPoint])
    this.pointGizmos[this.pointIndex].enable(true, true, true, false)
    this.pointGizmos[this.pointIndex - 1].enable(false, true, true, false)

    if (this.measuredPoints.length > 1) {
      this.value = this.shoelaceArea3D(this.polygonPoints, this.planeNormal)
      ret = this.pointGizmos[0].updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}²`,
        this.labelPoint
      )
      this.pointGizmos[0].enable(false, true, true, true)
    }

    if (this._state === MeasurementState.DANGLING_END) {
      this.pointGizmos[this.pointIndex - 1].updateLine([
        this.points[this.pointIndex - 2],
        this.points[0]
      ])
      this.pointGizmos[this.pointIndex - 1].enable(false, true, false, false)
      this.pointGizmos[this.pointIndex].enable(false, false, false, false)
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.pointGizmos[this.pointIndex].enable(false, false, false, false)
    }

    return ret
  }

  private updatePoleOfInnacessibility(points: Vector3[]) {
    const q = new Quaternion().setFromUnitVectors(
      this.planeNormal,
      new Vector3(0, 0, 1)
    )
    const invQ = new Quaternion().copy(q).invert()
    const vector = new Vector3()
    const flatPoints = points.map((p: Vector3) => {
      vector.copy(p)
      vector.applyQuaternion(q)
      return [vector.x, vector.y]
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const p = polylabel([flatPoints], 0.1)

    this.labelPoint.set(p[0], p[1], this.planeOrigin.z)
    this.labelPoint.applyQuaternion(invQ)
    this.projectOnPlane(
      this.labelPoint,
      this.planeOrigin,
      this.planeNormal,
      this.labelPoint
    )
  }

  private updateFillPolygon(points: Vector3[]) {
    if (!this.fillPolygon) {
      const material = new SpeckleBasicMaterial({
        color: 0x047efb,
        side: DoubleSide,
        opacity: 0.5,
        transparent: true,
        toneMapped: false
      })
      material.color.convertSRGBToLinear()
      this.fillPolygon = new Mesh(new BufferGeometry(), material)

      this.fillPolygon.frustumCulled = false
      this.fillPolygon.layers.set(ObjectLayers.MEASUREMENTS)
      this.add(this.fillPolygon)
    }
    const geometry = this.fillPolygon.geometry
    const position = geometry.getAttribute('position')
    const index = geometry.getIndex()

    if (points.length < 3) {
      this.fillPolygon.visible = false
      return
    }

    this.fillPolygon.visible = true

    const [axis1, axis2] = this.chooseProjectionAxes(this.planeNormal)

    const projectedPoints = points.map(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      (p) => new Vector2(p[axis1], p[axis2])
    )
    const indices = Geometry.triangulatePolygon(projectedPoints)

    if (!position || position.count !== points.length) {
      const buffer = new Float32Array(points.length * 3)
      points.forEach((point: Vector3, index) => point.toArray(buffer, index * 3))
      const posAttribute = new BufferAttribute(buffer, 3)
      posAttribute.setUsage(DynamicDrawUsage)
      geometry.setAttribute('position', posAttribute)
    } else {
      points.forEach((point: Vector3, index) =>
        point.toArray(position.array, index * 3)
      )
      position.needsUpdate = true
    }

    if (!index || index.count !== indices.length) {
      geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
    } else {
      ;(index.array as Uint16Array).set(indices, 0)
      index.needsUpdate = true
    }
    geometry.computeBoundingBox()
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const results: Array<Intersection> = []
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo2) => {
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
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo2) => {
      gizmo.highlight = value
    })
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo2) => {
      gizmo.updateClippingPlanes(planes)
    })
    ;(this.fillPolygon.material as Material).clippingPlanes = planes
  }

  private chooseProjectionAxes(normal: Vector3) {
    const absNormal = normal
      .clone()
      .set(Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z))

    if (absNormal.z >= absNormal.x && absNormal.z >= absNormal.y) {
      return ['x', 'y', 'z'] // Project to XY plane
    } else if (absNormal.y >= absNormal.x && absNormal.y >= absNormal.z) {
      return ['x', 'z', 'y'] // Project to XZ plane
    } else {
      return ['y', 'z', 'x'] // Project to YZ plane
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

  private projectOnPlane(
    point: Vector3,
    planeOrigin: Vector3,
    planeNormal: Vector3,
    destination?: Vector3
  ) {
    const p = _vec30.copy(point)
    const o = _vec31.copy(planeOrigin)
    const n = _vec32.copy(planeNormal).normalize()

    const v = p.sub(o)
    const dist = v.dot(n)
    return (destination ? destination : new Vector3())
      .copy(point)
      .sub(n.multiplyScalar(dist))
  }
}
