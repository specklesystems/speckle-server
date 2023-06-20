import { Box3, Camera, Plane, Vector3 } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo'
import { ObjectLayers } from '../SpeckleRenderer'
import { getConversionFactor } from '../converter/Units'
import { Measurement, MeasurementState } from './Measurement'

export class PerpendicularMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo = null
  private endGizmo: MeasurementPointGizmo = null
  private midPoint: Vector3 = new Vector3()

  public set isVisible(value: boolean) {
    this.startGizmo.enable(value, value, value, value)
    this.endGizmo.enable(value, value, value, value)
  }

  public get bounds(): Box3 {
    return new Box3().expandByPoint(this.startPoint).expandByPoint(this.midPoint)
  }

  public constructor() {
    super()
    this.type = 'PerpendicularMeasurement'
    this.startGizmo = new MeasurementPointGizmo()
    this.endGizmo = new MeasurementPointGizmo({ dashedLine: true, lineOpacity: 0.25 })
    this.startLineLength = 0.25
    this.add(this.startGizmo)
    this.add(this.endGizmo)
    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, bounds: Box3) {
    this.startGizmo.frameUpdate(camera, bounds)
    this.endGizmo.frameUpdate(camera, bounds)
  }

  public update() {
    this.startGizmo.updateDisc(this.startPoint, this.startNormal)
    this.startGizmo.updatePoint(this.startPoint)
    this.endGizmo.updateDisc(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = Measurement.vecBuff0.copy(this.startPoint)
      const startLine1 = Measurement.vecBuff1
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff2
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength)
        )
      this.startGizmo.updateLine([startLine0, startLine1])
      this.endGizmo.enable(false, false, false, false)
    }

    if (this._state === MeasurementState.DANGLING_END) {
      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = Measurement.vecBuff0
        .copy(this.startPoint)
        .sub(this.endPoint)
        .normalize()
      let dot = this.startNormal.dot(endStartDir)
      const angle = Math.acos(Math.min(Math.max(dot, -1), 1))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      this.midPoint.copy(
        Measurement.vecBuff0
          .copy(this.startPoint)
          .add(
            Measurement.vecBuff1
              .copy(this.startNormal)
              .multiplyScalar(this.startLineLength)
          )
      )
      const endLineNormal = Measurement.vecBuff1
        .copy(this.midPoint)
        .sub(this.endPoint)
        .normalize()

      this.endLineLength = this.midPoint.distanceTo(this.endPoint)

      dot = this.endNormal.dot(endLineNormal)
      const angle1 = Math.acos(Math.min(Math.max(dot, -1), 1))
      const dist1 = this.endLineLength * Math.cos(angle1)

      const endLine3 = Measurement.vecBuff1
        .copy(this.endPoint)
        .add(Measurement.vecBuff2.copy(this.endNormal).multiplyScalar(dist1))

      const startLine0 = Measurement.vecBuff2.copy(this.startPoint)
      const startLine1 = Measurement.vecBuff3
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff4
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength)
        )
      this.startGizmo.updateLine([startLine0, startLine1])

      const endLine0 = Measurement.vecBuff3.copy(this.endPoint)

      this.endGizmo.updateLine([
        endLine0,
        endLine3,
        endLine3,
        this.midPoint,
        this.midPoint,
        endLine0
      ])
      this.endGizmo.updatePoint(this.midPoint)

      const textPos = Measurement.vecBuff0
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff1
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      this.value = this.midPoint.distanceTo(this.startPoint)
      this.startGizmo.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`,
        textPos
      )
      this.endGizmo.enable(true, true, true, true)
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo.enable(false, true, true, true)
      this.endGizmo.enable(false, false, true, false)
    }
  }

  public raycast(raycaster, intersects) {
    const results = []
    this.startGizmo.raycast(raycaster, results)
    this.endGizmo.raycast(raycaster, results)
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
    this.startGizmo.highlight = value
    this.endGizmo.highlight = value
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.startGizmo.updateClippingPlanes(planes)
    this.endGizmo.updateClippingPlanes(planes)
  }
}
