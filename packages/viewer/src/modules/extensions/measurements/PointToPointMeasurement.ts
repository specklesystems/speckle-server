import {
  Box3,
  Camera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { getConversionFactor } from '../../converter/Units.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { MeasurementData, MeasurementType } from '@speckle/shared/viewer/state'

const vec3Buff3: Vector3 = new Vector3()

export class PointToPointMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo | null = null
  private endGizmo: MeasurementPointGizmo | null = null

  public set isVisible(value: boolean) {
    this.startGizmo?.enable(value, value, value, value)
    this.endGizmo?.enable(value, value, value, value)
  }

  public constructor() {
    super()
    this.type = 'PointToPointMeasurement'
    this.startGizmo = new MeasurementPointGizmo()
    this.endGizmo = new MeasurementPointGizmo({ dashedLine: true, lineOpacity: 0.25 })
    this.startLineLength = 0
    this.add(this.startGizmo)
    this.add(this.endGizmo)
    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.startGizmo?.frameUpdate(camera, size)
    this.endGizmo?.frameUpdate(camera, size)
  }

  public locationUpdated(point: Vector3, normal: Vector3): void {
    if (this.state === MeasurementState.DANGLING_START) {
      this.startPoint.copy(point)
      this.startNormal.copy(normal)
    } else if (this.state === MeasurementState.DANGLING_END) {
      this.endPoint.copy(point)
      this.endNormal.copy(normal)
    }
  }
  public locationSelected(): void {
    if (this.state === MeasurementState.DANGLING_START)
      this.state = MeasurementState.DANGLING_END
    else if (this.state === MeasurementState.DANGLING_END)
      this.state = MeasurementState.COMPLETE
  }

  public update(): Promise<void> {
    let ret: Promise<void> | undefined
    this.startGizmo?.updateNormalIndicator(this.startPoint, this.startNormal)
    this.startGizmo?.updatePoint(this.startPoint)
    this.endGizmo?.updateNormalIndicator(this.endPoint, this.endNormal)

    this.startLineLength = this.startPoint.distanceTo(this.endPoint)
    this.value = this.startLineLength

    const textPos = vec3Buff3
      .copy(this.startPoint)
      .add(this.endPoint)
      .multiplyScalar(0.5)

    if (this._state === MeasurementState.DANGLING_START) {
      this.startGizmo?.enable(true, false, true, false)
      this.endGizmo?.enable(false, false, false, false)
    }
    if (this._state === MeasurementState.DANGLING_END) {
      this.startGizmo?.enable(true, true, true, true)
      this.endGizmo?.enable(true, false, true, false)

      this.startGizmo?.updateLine([this.startPoint, this.endPoint])
      this.endGizmo?.updatePoint(this.endPoint)

      ret = this.startGizmo?.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`,
        textPos
      )
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo?.enable(false, true, true, true)
      this.endGizmo?.enable(false, false, true, false)

      this.startGizmo?.updateLine([this.startPoint, this.endPoint])
      this.endGizmo?.updatePoint(this.endPoint)
      ret = this.startGizmo?.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`,
        textPos
      )
    }
    return ret ?? Promise.resolve()
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const results: Array<Intersection> = []
    this.startGizmo?.raycast(raycaster, results)
    this.endGizmo?.raycast(raycaster, results)
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
    if (this.startGizmo) this.startGizmo.highlight = value
    if (this.endGizmo) this.endGizmo.highlight = value
  }

  public updateClippingPlanes(planes: Plane[]) {
    if (this.startGizmo) this.startGizmo.updateClippingPlanes(planes)
    if (this.endGizmo) this.endGizmo.updateClippingPlanes(planes)
  }

  public toMeasurementData(): MeasurementData {
    return {
      type: MeasurementType.POINTTOPOINT,
      startPoint: [this.startPoint.x, this.startPoint.y, this.startPoint.z],
      endPoint: [this.endPoint.x, this.endPoint.y, this.endPoint.z],
      startNormal: [this.startNormal.x, this.startNormal.y, this.startNormal.z],
      endNormal: [this.endNormal.x, this.endNormal.y, this.endNormal.z],
      value: this.value,
      units: this.units,
      precision: this.precision
    } as MeasurementData
  }

  public fromMeasurementData(data: MeasurementData): void {
    this.startPoint.set(data.startPoint[0], data.startPoint[1], data.startPoint[2])
    this.endPoint.set(data.endPoint[0], data.endPoint[1], data.endPoint[2])
    this.startNormal.set(data.startNormal[0], data.startNormal[1], data.startNormal[2])
    this.endNormal.set(data.endNormal[0], data.endNormal[1], data.endNormal[2])
    this.value = data.value
    this.units = data.units
    this.precision = data.precision || 1
    this._state = MeasurementState.COMPLETE
  }
}
