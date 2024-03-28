/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { PerspectiveCamera, OrthographicCamera, Vector3, Plane, Box3 } from 'three'
import { SpeckleView } from '../../..'
import { SectionToolEvent } from '../SectionTool'
import { SpeckleCameraControls } from '../../objects/SpeckleCameraControls'

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

export enum CameraProjection {
  PERSPECTIVE,
  ORTHOGRAPHIC
}

export enum CameraControllerEvent {
  Stationary,
  Dynamic,
  FrameUpdate,
  ProjectionChanged
}

export interface IProvider {
  get provide(): string
}

export interface ICameraProvider extends IProvider {
  get enabled(): boolean
  set enabled(val: boolean)
  get renderingCamera(): PerspectiveCamera | OrthographicCamera
  get controls(): SpeckleCameraControls
  setCameraView(objectIds: string[], transition: boolean, fit?: number)
  setCameraView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition: boolean
  )
  setCameraView(box: Box3, transition: boolean, fit?: number)
  on(e: CameraControllerEvent, handler: (data: unknown) => void)
  removeListener(e: CameraControllerEvent, handler: (data: unknown) => void)
}

export abstract class ICameraProvider {
  public static readonly Symbol = 'ICameraProvider'
  public static isCameraProvider(extension): extension is ICameraProvider {
    return 'renderingCamera' in extension
  }
}

export interface ISectionProvider extends IProvider {
  get enabled(): boolean
  set enabled(val: boolean)
  on(e: SectionToolEvent, handler: (data: Plane[]) => void)
  removeListener(e: SectionToolEvent, handler: (data: Plane[]) => void)
}

export abstract class ISectionProvider {
  public static readonly Symbol = 'ISectionProvider'
}
