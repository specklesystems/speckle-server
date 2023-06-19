/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Box3, Camera, Object3D, Plane, Vector3 } from 'three'

export enum MeasurementState {
  HIDDEN,
  DANGLING_START,
  DANGLING_END,
  COMPLETE
}

export abstract class Measurement extends Object3D {
  public startPoint: Vector3 = new Vector3()
  public endPoint: Vector3 = new Vector3()
  public startNormal: Vector3 = new Vector3()
  public endNormal: Vector3 = new Vector3()
  public startLineLength: number
  public endLineLength: number
  public value = 0
  public units = 'm'
  public precision = 2

  protected static vecBuff0: Vector3 = new Vector3()
  protected static vecBuff1: Vector3 = new Vector3()
  protected static vecBuff2: Vector3 = new Vector3()
  protected static vecBuff3: Vector3 = new Vector3()
  protected static vecBuff4: Vector3 = new Vector3()

  protected _state: MeasurementState = MeasurementState.HIDDEN

  public set state(value: MeasurementState) {
    this._state = value
  }

  public get state() {
    return this._state
  }

  public set isVisible(value: boolean) {}

  public frameUpdate(camera: Camera, bounds: Box3) {}
  public update() {}
  public raycast(raycaster, intersects) {}
  public highlight(value: boolean) {}
  public updateClippingPlanes(planes: Plane[]) {}
}
