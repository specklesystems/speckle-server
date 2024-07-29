import { Box3, Camera, Plane, Raycaster, Vector2, type Intersection } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { getConversionFactor } from '../../converter/Units.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'

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
    this.startGizmo?.frameUpdate(camera, bounds)
    this.endGizmo?.frameUpdate(camera, bounds)
  }

  public update() {
    this.startGizmo?.updateDisc(this.startPoint, this.startNormal)
    this.startGizmo?.updatePoint(this.startPoint)
    this.endGizmo?.updateDisc(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = Measurement.vec3Buff0.copy(this.startPoint)
      const startLine1 = Measurement.vec3Buff1
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff2
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength)
        )
      this.startGizmo?.updateLine([startLine0, startLine1])
      this.endGizmo?.enable(false, false, false, false)
    }
    if (this._state === MeasurementState.DANGLING_END) {
      this.startLineLength = this.startPoint.distanceTo(this.endPoint)
      this.value = this.startLineLength

      const endStartDir = Measurement.vec3Buff0
        .copy(this.endPoint)
        .sub(this.startPoint)
        .normalize()
      const lineEndPoint = Measurement.vec3Buff1
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff2.copy(endStartDir).multiplyScalar(this.startLineLength)
        )

      const textPos = Measurement.vec3Buff3
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff4
            .copy(endStartDir)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      this.startGizmo?.updateLine([this.startPoint, lineEndPoint])
      this.endGizmo?.updatePoint(lineEndPoint)
      this.startGizmo?.updateText(
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
      this.startGizmo?.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`
      )
    }
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
