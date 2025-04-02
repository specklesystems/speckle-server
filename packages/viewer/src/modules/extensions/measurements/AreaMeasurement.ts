import {
  Box3,
  Camera,
  Plane,
  PlaneHelper,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { Measurement } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'

export class AreaMeasurement extends Measurement {
  private pointGizmos: MeasurementPointGizmo[]
  private pointIndex: number = 0
  private surfacePoint: Vector3 = new Vector3()
  private surfaceNormal: Vector3 = new Vector3()
  private projectionPlane: Plane = new Plane()
  public projectionPlaneHelper: PlaneHelper
  private planePoints: Vector3[] = []

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

    this.projectionPlaneHelper = new PlaneHelper(this.projectionPlane, 10, 0xffff00)
    this.projectionPlaneHelper.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.pointGizmos.forEach((gizmo: MeasurementPointGizmo) => {
      gizmo.frameUpdate(camera, bounds)
    })
  }

  public setPointAndNormal(point: Vector3, normal: Vector3) {
    this.surfacePoint.copy(point)
    this.surfaceNormal.copy(normal)
  }

  public addPoint() {
    const gizmo = new MeasurementPointGizmo()
    gizmo.enable(false, true, true, false)
    this.pointGizmos.push(gizmo)
    this.add(gizmo)
    const projectedPoint = new Vector3().copy(this.surfacePoint)

    // if (this.pointIndex > 0) {
    //   this.projectionPlane.projectPoint(this.surfacePoint, projectedPoint)
    // }
    this.startPoint.copy(projectedPoint)
    this.startNormal.copy(this.projectionPlane.normal)
    this.pointIndex++
    this.planePoints.push(new Vector3().copy(projectedPoint))

    if (this.planePoints.length === 3) {
      this.projectionPlane.setFromCoplanarPoints(
        this.planePoints[0],
        this.planePoints[1],
        this.planePoints[2]
      )
    }
  }

  public update(): Promise<void> {
    const ret: Promise<void> = Promise.resolve()

    if (this.pointIndex === 0) {
      this.pointGizmos[this.pointIndex].updatePoint(this.surfacePoint)
      this.startPoint.copy(this.surfacePoint)
      this.startNormal.copy(this.surfaceNormal)
    } else {
      this.startLineLength = this.startPoint.distanceTo(this.surfacePoint)
      this.value = this.startLineLength

      const endStartDir = Measurement.vec3Buff0
        .copy(this.surfacePoint)
        .sub(this.startPoint)
        .normalize()
      const lineEndPoint = Measurement.vec3Buff1
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff2.copy(endStartDir).multiplyScalar(this.startLineLength)
        )

      this.pointGizmos[this.pointIndex].updateLine([this.startPoint, lineEndPoint])
      this.pointGizmos[this.pointIndex].updatePoint(lineEndPoint)
      this.pointGizmos[this.pointIndex].enable(false, true, true, false)
    }
    // if (this._state === MeasurementState.COMPLETE) {
    //   this.startGizmo?.enable(false, true, true, true)
    //   this.endGizmo?.enable(false, false, true, false)
    //   if (this.startGizmo)
    //     ret = this.startGizmo.updateText(
    //       `${(this.value * getConversionFactor('m', this.units)).toFixed(
    //         this.precision
    //       )} ${this.units}`
    //     )
    // }
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
}
