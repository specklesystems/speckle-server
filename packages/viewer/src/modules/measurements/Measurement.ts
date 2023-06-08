import { Matrix4, Vector3 } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo'

export enum MeasurementState {
  HIDDEN,
  DANGLING_START,
  DANGLING_END,
  COMPLETE
}

export class Measurement {
  public startPoint: Vector3 = new Vector3()
  public endPoint: Vector3 = new Vector3()
  public startNormal: Vector3 = new Vector3()
  public endNormal: Vector3 = new Vector3()
  public startLineLength: number
  public endLineLength: number
  public value = 0

  public startGizmo: MeasurementPointGizmo = null
  public endGizmo: MeasurementPointGizmo = null

  private _state: MeasurementState = MeasurementState.HIDDEN

  public set state(value: MeasurementState) {
    this._state = value
  }

  public get state() {
    return this._state
  }

  public constructor() {
    this.startGizmo = new MeasurementPointGizmo()
    this.endGizmo = new MeasurementPointGizmo()
    this.endGizmo.dashed = true
    this.startLineLength = 0.25
  }

  public update() {
    this.startGizmo.updateDisc(this.startPoint, this.startNormal)
    this.startGizmo.updatePoint(this.startPoint)
    this.endGizmo.updateDisc(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = new Vector3().copy(this.startPoint)
      const startLine1 = new Vector3()
        .copy(this.startPoint)
        .add(new Vector3().copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo.updateLine([startLine0, startLine1])
    }
    if (this._state === MeasurementState.DANGLING_END) {
      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = new Vector3()
        .copy(this.startPoint)
        .sub(this.endPoint)
        .normalize()
      const angle = Math.acos(this.startNormal.dot(endStartDir))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      const intersectPoint = new Vector3()
        .copy(this.startPoint)
        .add(new Vector3().copy(this.startNormal).multiplyScalar(this.startLineLength))
      const endLineNormal = new Vector3()
        .copy(intersectPoint)
        .sub(this.endPoint)
        .normalize()

      this.endLineLength = intersectPoint.distanceTo(this.endPoint)

      const angle1 = Math.acos(this.endNormal.dot(endLineNormal))
      const dist1 = this.endLineLength * Math.cos(angle1)

      const endLine3 = new Vector3()
        .copy(this.endPoint)
        .add(new Vector3().copy(this.endNormal).multiplyScalar(dist1))

      const startLine0 = new Vector3().copy(this.startPoint)
      const startLine1 = new Vector3()
        .copy(this.startPoint)
        .add(new Vector3().copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo.updateLine([startLine0, startLine1])

      const endLine0 = new Vector3().copy(this.endPoint)

      this.endGizmo.updateLine([
        endLine0,
        endLine3,
        endLine3,
        intersectPoint,
        intersectPoint,
        endLine0
      ])
      this.endGizmo.updatePoint(intersectPoint)

      const textPos = new Vector3()
        .copy(this.startPoint)
        .add(
          new Vector3()
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength * 0.5)
        )
      const textTransform = new Matrix4().makeTranslation(
        textPos.x,
        textPos.y,
        textPos.z
      )
      const textValue = intersectPoint.distanceTo(this.startPoint)
      this.startGizmo.updateText(textValue, textTransform)
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo.enable(false, true, true, true)
      this.endGizmo.enable(false, false, true, false)
    }
  }
}
