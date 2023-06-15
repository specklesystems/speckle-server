import { Box3, Camera } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo'
import { ObjectLayers } from '../SpeckleRenderer'
import { getConversionFactor } from '../converter/Units'
import { Measurement, MeasurementState } from './Measurement'

export class PerpendicularMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo = null
  private endGizmo: MeasurementPointGizmo = null

  public set isVisible(value: boolean) {
    this.startGizmo.enable(value, value, value, value)
    this.endGizmo.enable(value, value, value, value)
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
    }

    if (this._state === MeasurementState.DANGLING_END) {
      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = Measurement.vecBuff0
        .copy(this.startPoint)
        .sub(this.endPoint)
        .normalize()
      const angle = Math.acos(this.startNormal.dot(endStartDir))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      const intersectPoint = Measurement.vecBuff0
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff1
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength)
        )
      const endLineNormal = Measurement.vecBuff1
        .copy(intersectPoint)
        .sub(this.endPoint)
        .normalize()

      this.endLineLength = intersectPoint.distanceTo(this.endPoint)

      const angle1 = Math.acos(this.endNormal.dot(endLineNormal))
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
        intersectPoint,
        intersectPoint,
        endLine0
      ])
      this.endGizmo.updatePoint(intersectPoint)

      const textPos = Measurement.vecBuff0
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff1
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      const textValue = intersectPoint.distanceTo(this.startPoint)
      this.startGizmo.updateText(
        `${(textValue * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`,
        textPos
      )
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
}
