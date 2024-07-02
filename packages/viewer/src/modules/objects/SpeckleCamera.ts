import { Box3, OrthographicCamera, PerspectiveCamera } from 'three'

export enum CameraEvent {
  Stationary = 'stationary',
  Dynamic = 'dynamic',
  FrameUpdate = 'frame-update',
  LateFrameUpdate = 'late-frame-update',
  ProjectionChanged = 'projection-changed',
  InteractionStarted = 'interaction-started',
  InteractionEnded = 'interaction-ended'
}

export interface CameraEventPayload {
  [CameraEvent.Stationary]: void
  [CameraEvent.Dynamic]: void
  [CameraEvent.FrameUpdate]: boolean
  [CameraEvent.LateFrameUpdate]: boolean
  [CameraEvent.ProjectionChanged]: CameraProjection
  [CameraEvent.InteractionStarted]: void
  [CameraEvent.InteractionEnded]: void
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
  updateCameraPlanes(targetVolume?: Box3, offsetScale?: number): void
}
export enum CameraProjection {
  PERSPECTIVE,
  ORTHOGRAPHIC
}
