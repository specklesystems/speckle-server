import { Vector3 } from 'three'
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
  public endLineNormal: Vector3 = new Vector3()
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
    this.startLineLength = 0.25
  }

  public update() {
    this.startGizmo.updateDisc(this.startPoint, this.startNormal)
    this.endGizmo.updateDisc(this.endPoint, this.endNormal)

    if (this.startLineLength > 0) {
      const startLine0 = new Vector3().copy(this.startPoint)
      const startLine1 = new Vector3()
        .copy(this.startPoint)
        .add(new Vector3().copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo.updateLine(startLine0, startLine1)
    }
    if (this.endLineLength > 0) {
      const endLine0 = new Vector3().copy(this.endPoint)
      const endLine1 = new Vector3()
        .copy(this.endPoint)
        .add(new Vector3().copy(this.endLineNormal).multiplyScalar(this.endLineLength))
      this.endGizmo.updateLine(endLine0, endLine1)
    }
  }
}
