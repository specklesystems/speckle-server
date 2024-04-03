import { Box3, OrthographicCamera, PerspectiveCamera } from 'three'

export enum CameraEvent {
  Stationary,
  Dynamic,
  FrameUpdate,
  ProjectionChanged
}

export interface SpeckleCamera {
  get renderingCamera(): PerspectiveCamera | OrthographicCamera
  get fieldOfView(): number
  set fieldOfView(value: number)
  get aspect(): number
  on(type: CameraEvent, handler: (...args) => void)
  setCameraPlanes(targetVolume: Box3, offsetScale?: number)
}
export enum CameraProjection {
  PERSPECTIVE,
  ORTHOGRAPHIC
}
