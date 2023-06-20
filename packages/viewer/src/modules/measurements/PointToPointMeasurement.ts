/* eslint-disable no-empty */
import { Box3, Camera, Plane } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo'
import { ObjectLayers } from '../SpeckleRenderer'
import { getConversionFactor } from '../converter/Units'
import { Measurement, MeasurementState } from './Measurement'

export class PointToPointMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo = null
  private endGizmo: MeasurementPointGizmo = null

  public set isVisible(value: boolean) {
    this.startGizmo.enable(value, value, value, value)
    this.endGizmo.enable(value, value, value, value)
  }

  public constructor() {
    super()
    this.type = 'PointToPointMeasurement'
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
      this.startLineLength = this.startPoint.distanceTo(this.endPoint)
      this.value = this.startLineLength

      const endStartDir = Measurement.vecBuff0
        .copy(this.endPoint)
        .sub(this.startPoint)
        .normalize()
      const lineEndPoint = Measurement.vecBuff1
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff2.copy(endStartDir).multiplyScalar(this.startLineLength)
        )

      const textPos = Measurement.vecBuff3
        .copy(this.startPoint)
        .add(
          Measurement.vecBuff4
            .copy(endStartDir)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      this.startGizmo.updateLine([this.startPoint, lineEndPoint])
      this.endGizmo.updatePoint(lineEndPoint)
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
