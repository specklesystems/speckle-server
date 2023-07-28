import { PerspectiveCamera, OrthographicCamera } from 'three'

export enum CameraDeltaEvent {
  Stationary,
  Dynamic,
  FrameUpdate
}

export interface ICameraProvider {
  get renderingCamera(): PerspectiveCamera | OrthographicCamera
  cameraDeltaUpdate: (type: CameraDeltaEvent, data?) => void
}

export function isCameraProvider(extension): extension is ICameraProvider {
  return 'renderingCamera' in extension
}
