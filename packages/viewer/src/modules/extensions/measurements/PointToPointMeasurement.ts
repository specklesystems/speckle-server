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

const vec3Buff0: Vector3 = new Vector3()
const vec3Buff1: Vector3 = new Vector3()
const vec3Buff2: Vector3 = new Vector3()
const vec3Buff3: Vector3 = new Vector3()
const vec3Buff4: Vector3 = new Vector3()

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
    let ret: Promise<void> = Promise.resolve()
    this.startGizmo?.updateNormalIndicator(this.startPoint, this.startNormal)
    this.startGizmo?.updatePoint(this.startPoint)
    this.endGizmo?.updateNormalIndicator(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = vec3Buff0.copy(this.startPoint)
      const startLine1 = vec3Buff1
        .copy(this.startPoint)
        .add(vec3Buff2.copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo?.updateLine([startLine0, startLine1])
      this.endGizmo?.enable(false, false, false, false)
    }
    if (this._state === MeasurementState.DANGLING_END) {
      this.startLineLength = this.startPoint.distanceTo(this.endPoint)
      this.value = this.startLineLength

      const endStartDir = vec3Buff0.copy(this.endPoint).sub(this.startPoint).normalize()
      const lineEndPoint = vec3Buff1
        .copy(this.startPoint)
        .add(vec3Buff2.copy(endStartDir).multiplyScalar(this.startLineLength))

      const textPos = vec3Buff3
        .copy(this.startPoint)
        .add(vec3Buff4.copy(endStartDir).multiplyScalar(this.startLineLength * 0.5))

      this.startGizmo?.updateLine([this.startPoint, lineEndPoint])
      this.endGizmo?.updatePoint(lineEndPoint)
      if (this.startGizmo)
        ret = this.startGizmo.updateText(
          `${(this.value * getConversionFactor('m', this.units)).toFixed(
            this.precision
          )} ${this.units}`,
          textPos
        )
      this.endGizmo?.enable(true, true, true, true)
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo?.enable(false, true, true, true)
      this.endGizmo?.enable(false, false, true, false)
      if (this.startGizmo)
        ret = this.startGizmo.updateText(
          `${(this.value * getConversionFactor('m', this.units)).toFixed(
            this.precision
          )} ${this.units}`
        )
    }
    return ret
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
}
