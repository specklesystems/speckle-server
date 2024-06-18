import {
  Box3,
  Camera,
  Object3D,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
  type Intersection
} from 'three'

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
  public startLineLength!: number
  public endLineLength!: number
  public value = 0
  public units = 'm'
  public precision = 2

  protected static vec3Buff0: Vector3 = new Vector3()
  protected static vec3Buff1: Vector3 = new Vector3()
  protected static vec3Buff2: Vector3 = new Vector3()
  protected static vec3Buff3: Vector3 = new Vector3()
  protected static vec3Buff4: Vector3 = new Vector3()
  protected static vec4Buff0: Vector4 = new Vector4()
  protected static vec4Buff1: Vector4 = new Vector4()
  protected static vec4Buff2: Vector4 = new Vector4()
  protected static vec2Buff0: Vector2 = new Vector2()

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

  public get bounds(): Box3 {
    return new Box3().expandByPoint(this.startPoint).expandByPoint(this.endPoint)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public frameUpdate(camera: Camera | null, size: Vector2, _bounds: Box3) {
    this.renderingCamera = camera
    this.renderingSize.copy(size)
  }

  public abstract update(): void
  public abstract raycast(_raycaster: Raycaster, _intersects: Array<Intersection>): void
  public abstract highlight(_value: boolean): void
  public abstract updateClippingPlanes(_planes: Plane[]): void
}
