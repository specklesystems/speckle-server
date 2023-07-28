import { PerspectiveCamera, OrthographicCamera, Vector3 } from 'three'
import { SpeckleView } from '../../..'

export type CanonicalView =
  | 'front'
  | 'back'
  | 'up'
  | 'top'
  | 'down'
  | 'bottom'
  | 'right'
  | 'left'
  | '3d'
  | '3D'

export type InlineView = {
  position: Vector3
  target: Vector3
}

export type PolarView = {
  azimuth: number
  polar: number
  radius?: number
  origin?: Vector3
}

export enum CameraDeltaEvent {
  Stationary,
  Dynamic,
  FrameUpdate
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IProvider {
  get provide(): string
}

export interface ICameraProvider extends IProvider {
  get renderingCamera(): PerspectiveCamera | OrthographicCamera
  cameraDeltaUpdate: (type: CameraDeltaEvent, data?) => void
  setCameraView(objectIds: string[], transition: boolean, fit?: number)
  setCameraView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition: boolean
  )
}

export abstract class ICameraProvider {
  public static readonly Symbol = 'ICameraProvider'
  public static isCameraProvider(extension): extension is ICameraProvider {
    return 'renderingCamera' in extension
  }
}
