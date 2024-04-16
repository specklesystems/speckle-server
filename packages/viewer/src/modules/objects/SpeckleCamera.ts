import { Box3, OrthographicCamera, PerspectiveCamera } from 'three'

export enum CameraEvent {
  Stationary = 'stationary',
  Dynamic = 'dynamic',
  FrameUpdate = 'frame-update',
  ProjectionChanged = 'projection-changed'
}

export interface CameraEventPayload {
  [CameraEvent.Stationary]: void
  [CameraEvent.Dynamic]: void
  [CameraEvent.FrameUpdate]: boolean
  [CameraEvent.ProjectionChanged]: CameraProjection
}

export interface SpeckleCamera {
  get renderingCamera(): PerspectiveCamera | OrthographicCamera
  get fieldOfView(): number
  set fieldOfView(value: number)
  get aspect(): number
  on<T extends CameraEvent>(
    eventType: T,
    listener: (arg: CameraEventPayload[T]) => void
  ): void
  setCameraPlanes(targetVolume: Box3, offsetScale?: number): void
}
export enum CameraProjection {
  PERSPECTIVE,
  ORTHOGRAPHIC
}
