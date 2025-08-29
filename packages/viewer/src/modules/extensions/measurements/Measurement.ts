import {
  Box3,
  Camera,
  Object3D,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { ExtendedMeshIntersection } from '../../objects/SpeckleRaycaster.js'
import { MeasurementData, MeasurementType } from '@speckle/shared/viewer/state'

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

  protected _state: MeasurementState = MeasurementState.HIDDEN
  protected renderingCamera: Camera | null
  protected renderingSize: Vector2 = new Vector2()

  public set state(value: MeasurementState) {
    this._state = value
  }

  public get state() {
    return this._state
  }

  public abstract set isVisible(value: boolean)
  public abstract get measurementType(): MeasurementType

  public get bounds(): Box3 {
    return new Box3().expandByPoint(this.startPoint).expandByPoint(this.endPoint)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public frameUpdate(camera: Camera | null, size: Vector2, _bounds?: Box3) {
    this.renderingCamera = camera
    this.renderingSize.copy(size)
  }

  public abstract update(): Promise<void>
  public abstract raycast(_raycaster: Raycaster, _intersects: Array<Intersection>): void
  public abstract highlight(_value: boolean): void
  public abstract updateClippingPlanes(_planes: Plane[]): void
  public abstract locationUpdated(
    point?: Vector3,
    normal?: Vector3,
    ndcScreen?: Vector2
  ): void
  public abstract locationSelected(
    point?: Vector3,
    normal?: Vector3,
    ndcScreen?: Vector2
  ): void
  public snap?(
    ndcPoint: Vector2,
    intersection: ExtendedMeshIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ): boolean

  public toMeasurementData(): MeasurementData {
    return {
      type: this.measurementType,
      startPoint: [this.startPoint.x, this.startPoint.y, this.startPoint.z],
      endPoint: [this.endPoint.x, this.endPoint.y, this.endPoint.z],
      startNormal: [this.startNormal.x, this.startNormal.y, this.startNormal.z],
      endNormal: [this.endNormal.x, this.endNormal.y, this.endNormal.z],
      value: this.value
      // units: this.units, // We don't write units per measurement
      // precision: this.precision // We don't write precision per measurement
    } as MeasurementData
  }

  public fromMeasurementData(data: MeasurementData): void {
    this.startPoint.set(data.startPoint[0], data.startPoint[1], data.startPoint[2])
    this.endPoint.set(data.endPoint[0], data.endPoint[1], data.endPoint[2])
    this.startNormal.set(data.startNormal[0], data.startNormal[1], data.startNormal[2])
    this.endNormal.set(data.endNormal[0], data.endNormal[1], data.endNormal[2])
    this.value = data.value
    // this.units = data.units // We don't read units per measurement
    // this.precision = data.precision // We don't read precision per measurement
    this._state = MeasurementState.COMPLETE
  }
}
