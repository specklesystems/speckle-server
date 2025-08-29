import {
  AlwaysStencilFunc,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Camera,
  DoubleSide,
  DynamicDrawUsage,
  KeepStencilOp,
  Material,
  Mesh,
  NotEqualStencilFunc,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Raycaster,
  ReplaceStencilOp,
  Uint16BufferAttribute,
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
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { ExtendedMeshIntersection } from '../../objects/SpeckleRaycaster.js'
import { MeasurementData, MeasurementType } from '@speckle/shared/viewer/state'

const _vec30 = new Vector3()
const _vec31 = new Vector3()
const _vec32 = new Vector3()

export class AreaMeasurement extends Measurement {
  /** We store all gizmos here */
  private pointGizmos: MeasurementPointGizmo[] = []

  /** This stores the last touched point position and normal */
  private surfacePoint: Vector3 = new Vector3()
  private surfaceNormal: Vector3 = new Vector3()

  /** The plane params defined by the first placed point
   *  When serialized they will go in the measurements startPoint and startNormal
   */
  private planeOrigin: Vector3 = new Vector3()
  private planeNormal: Vector3 = new Vector3()

  /** The location of the area text label */
  private labelPoint: Vector3 = new Vector3()

  /** Various point list. A bit exhaustive, but safer */
  private pointIndex: number = 0
  /** The selected points in 3D space */
  private points: Vector3[] = []
  /** The selected points projected on the measurement plane */
  private measuredPoints: Vector3[] = []
  /** The points defining the fill polygon. Also projected on the measurement plane */
  private polygonPoints: Vector3[] = []

  private fillPolygon: Mesh
  private snapDistance: number = 10

  public set isVisible(value: boolean) {
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.enable(value, value, value, value)
    })
  }

  public get bounds(): Box3 {
    const box = new Box3()
    this.polygonPoints.forEach((point: Vector3) => box.expandByPoint(point))
    return box
  }

  public get measurementType(): MeasurementType {
    return MeasurementType.AREA
  }

  public constructor() {
    super()

    this.type = 'AreaMeasurement'
    /** We create the initial gizmo which will always display the area value text label*/
    const gizmo = new MeasurementPointGizmo()
    /** The gizmo's TextLabel will write `1` to the stencil buffer */
    gizmo.text.backgroundMaterial.stencilWrite = true
    gizmo.text.backgroundMaterial.depthWrite = false
    gizmo.text.backgroundMaterial.depthTest = false
    gizmo.text.backgroundMaterial.stencilFunc = AlwaysStencilFunc
    gizmo.text.backgroundMaterial.stencilRef = 1
    gizmo.text.backgroundMaterial.stencilZPass = ReplaceStencilOp

    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(this.pointGizmos[0])
    this.layers.set(ObjectLayers.MEASUREMENTS)

    /** The polygon will always contain the last touched point to allow real time updates */
    this.polygonPoints.push(new Vector3())
  }

  /** Frame */
  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.frameUpdate(camera, size)
    })
  }

  /** Called whenver the last touched location updates */
  public locationUpdated(point: Vector3, normal: Vector3) {
    this.surfacePoint.copy(point)
    this.surfaceNormal.copy(normal)

    /** Update the polygon first point */
    this.projectOnPlane(
      this.surfacePoint,
      this.planeOrigin,
      this.planeNormal,
      this.polygonPoints[0]
    )

    this.updateFillPolygon(this.polygonPoints)
  }

  /** Called whenver a location is selected for measuring*/
  public locationSelected() {
    /** If first point, determine the measurement plane */
    if (this.pointIndex === 0) {
      this.planeOrigin.copy(this.surfacePoint)
      this.planeNormal.copy(this.surfaceNormal)
      this.startPoint.copy(this.surfacePoint)
      this.startNormal.copy(this.startNormal)
    }

    this.addPoint(this.surfacePoint)
  }

  /** Adds a point to the area measurement */
  public addPoint(point: Vector3): number {
    const measuredPoint = new Vector3().copy(point)
    if (this.pointIndex > 0) {
      measuredPoint.copy(this.projectOnPlane(point, this.planeOrigin, this.planeNormal))
      /** Check to see if added location coincides with the first one. If yes, close the measurement */
      const distanceToFirst = point.distanceTo(this.points[0])
      if (distanceToFirst < 1e-10) {
        this._state = MeasurementState.COMPLETE
        measuredPoint.copy(this.measuredPoints[0])
        point.copy(this.points[0])
      }
    }

    /** Add a new gizmo */
    const gizmo = new MeasurementPointGizmo()

    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(gizmo)

    /** Push the points */
    this.points.push(point.clone())
    this.measuredPoints.push(measuredPoint)
    this.polygonPoints.push(measuredPoint)
    this.pointIndex++

    void this.update()

    /** Update polygon and label if required */
    if (this.points.length >= 2) {
      this.projectOnPlane(
        point,
        this.planeOrigin,
        this.planeNormal,
        this.polygonPoints[0]
      )
      this.updateFillPolygon(this.polygonPoints)
      this.updateLabelLocation(this.measuredPoints)
    }

    return this.points.length
  }

  /** Removes point from the measurement */
  public removePoint(): number {
    if (this.pointIndex < 1) return 0
    this.remove(this.pointGizmos.pop() as MeasurementPointGizmo)
    this.points.pop()
    this.measuredPoints.pop()
    this.polygonPoints.pop()
    this.pointIndex--

    void this.update()
    this.updateFillPolygon(this.polygonPoints)
    this.updateLabelLocation(this.measuredPoints)

    return this.points.length
  }

  /** Auto completes the measurement by joining with the first point */
  public autoFinish() {
    this.surfacePoint.copy(this.planeOrigin)
    this.surfaceNormal.copy(this.planeNormal)
    this.locationSelected()
  }

  /** Area measurement's custom snap function. We snap to the first point by design */
  public snap(
    ndcPoint: Vector2,
    _intersection: ExtendedMeshIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ): boolean {
    if (this.pointIndex < 2) return false

    /** First point NDC */
    const firstPointSS = new Vector3()
      .copy(this.points[0])
      .project(this.renderingCamera as PerspectiveCamera | OrthographicCamera)
    firstPointSS.set(
      (firstPointSS.x * 0.5 + 0.5) * this.renderingSize.x,
      (firstPointSS.y * -0.5 + 0.5) * this.renderingSize.y,
      0
    )
    /** Mouse point NDC */
    const mousePointSS = new Vector3(
      (ndcPoint.x * 0.5 + 0.5) * this.renderingSize.x,
      (ndcPoint.y * -0.5 + 0.5) * this.renderingSize.y,
      0
    )
    const SSDistance = firstPointSS.distanceTo(mousePointSS)

    /** If distance smaller than threshold, snap */
    if (SSDistance < this.snapDistance * window.devicePixelRatio) {
      outPoint.copy(this.points[0])
      outNormal.copy(this.planeNormal)
      return true
    }

    return false
  }

  /** Updates the gizmo components based on it's state and values */
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

    if (this._state === MeasurementState.COMPLETE) {
      for (let k = 0; k < this.points.length - 1; k++) {
        this.pointGizmos[k].updatePoint(this.points[k])
        this.pointGizmos[k].updateLine([this.points[k], this.points[k + 1]])
        this.pointGizmos[k].enable(false, true, true, false)
      }

      this.pointGizmos[this.points.length - 1].updateLine([
        this.points[this.points.length - 1],
        this.points[0]
      ])
      /** There is always an extra gizmo, so gizmo count is point count + 1 */
      this.pointGizmos[this.points.length].enable(false, false, false, false)
      this.pointGizmos[this.points.length - 1].enable(false, false, false, false)
      this.pointGizmos[0].enable(false, true, true, true)

      /** We force a sync so that we get correct timing on text finshing */
      this.pointGizmos[0].text._needsSync = true
      ret = this.pointGizmos[0].updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}²`,
        this.labelPoint
      )
    }

    return ret
  }

  /** Updates the area label location using the polyong's pole of innaccessibility
   *  We do this to avoid having the label outside of the polygin in case of concave polygons
   *  It works great for concave polygons, but not so great for convex regular ones
   */
  private updateLabelLocation(points: Vector3[]) {
    /** We place points on the XY plane since the library requires us to */
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
    /** We rotate back */
    this.labelPoint.applyQuaternion(invQ)
    this.projectOnPlane(
      this.labelPoint,
      this.planeOrigin,
      this.planeNormal,
      this.labelPoint
    )
  }

  /** Updates the measured polygon's geometry */
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
      /** The transparent area plane will only draw were the stencil buffer is **NOT** `1`, effectively not overdrawing the text label */
      material.depthWrite = false
      material.depthTest = false
      material.stencilWrite = true
      material.stencilFunc = NotEqualStencilFunc
      material.stencilRef = 1
      material.stencilZPass = KeepStencilOp

      this.fillPolygon = new Mesh(new BufferGeometry(), material)
      this.fillPolygon.renderOrder = 100
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
      geometry.setIndex(new Uint16BufferAttribute(indices, 1))
    } else {
      ;(index.array as Uint16Array).set(indices, 0)
      index.needsUpdate = true
    }
    geometry.computeBoundingBox()
  }

  /** Measurement's custom picking. We don't test the polygon when casting */
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
    ;(this.fillPolygon.material as Material).clippingPlanes = planes
  }

  /** Had to make my own. Three's Hesse normal form trips me up */
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

  /** Selects the vector components to use based on the measurement plane.
   *  Don't really like it, but it works
   */
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

  /** Area calculation */
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

  public toMeasurementData(): MeasurementData {
    const data = super.toMeasurementData()
    data.startPoint = [this.planeOrigin.x, this.planeOrigin.y, this.planeOrigin.z]
    data.startNormal = [this.planeNormal.x, this.planeNormal.y, this.planeNormal.z]
    data.innerPoints = this.points.map((value) => [value.x, value.y, value.z])
    return data
  }

  public fromMeasurementData(data: MeasurementData): void {
    super.fromMeasurementData(data)
    this.planeOrigin.fromArray(data.startPoint)
    this.planeNormal.fromArray(data.startNormal)
    if (data.innerPoints) {
      for (let k = 0; k < data.innerPoints?.length; k++) {
        this.addPoint(new Vector3().fromArray(data.innerPoints[k]))
      }
    }
  }
}
