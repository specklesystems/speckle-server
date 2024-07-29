import { Vector3 } from 'three'
import { type PropertyInfo } from './modules/filtering/PropertyManager.js'
import type { Query, QueryArgsResultMap } from './modules/queries/Query.js'
import { type TreeNode, WorldTree } from './modules/tree/WorldTree.js'
import { type Utils } from './modules/Utils.js'
import defaultHdri from './assets/hdri/Mild-dwab.png'
import { World } from './modules/World.js'
import SpeckleRenderer from './modules/SpeckleRenderer.js'
import { Extension } from './modules/extensions/Extension.js'
import { Loader } from './modules/loaders/Loader.js'
import { type Constructor } from 'type-fest'
import type { Vector3Like } from './modules/batching/BatchObject.js'
import type { FilteringState } from './modules/extensions/FilteringExtension.js'

export type SpeckleReference = {
  referencedId: string
}

export type SpeckleObject = {
  [k: string]: unknown
  speckle_type: string
  id: string
  elements?: SpeckleReference[]
  children?: SpeckleObject[] | SpeckleReference[]
  name?: string
  referencedId?: string
  units?: string
  applicationId?: string
}

export interface ViewerParams {
  showStats: boolean
  environmentSrc: Asset
  verbose: boolean
}
export enum AssetType {
  TEXTURE_8BPP = 'png', // For now
  TEXTURE_HDR = 'hdr',
  TEXTURE_EXR = 'exr',
  FONT_JSON = 'font-json'
}

export interface Asset {
  id: string
  src: string
  type: AssetType
}

/**
 * The default HDRI the viewer uses is actually a true HDR image (.exr),
 * specified by the explicit TEXTURE_EXR
 *
 * We do this because bundling an actual .exr or .hdr image format would require
 * anybody consuming the viewer to make adjustments to their build config, to enable
 * its import.
 *
 * Three.js doesn't mind the extension of the asset you load, so an .exr hidden behind
 * a .png will work just fine.
 */
export const DefaultViewerParams: ViewerParams = {
  showStats: false,
  verbose: false,
  environmentSrc: {
    id: 'defaultHDRI',
    src: defaultHdri,
    type: AssetType.TEXTURE_EXR
  }
}

export enum ViewerEvent {
  ObjectClicked = 'object-clicked',
  ObjectDoubleClicked = 'object-doubleclicked',
  LoadComplete = 'load-complete',
  UnloadComplete = 'unload-complete',
  UnloadAllComplete = 'unload-all-complete',
  Busy = 'busy',
  FilteringStateSet = 'filtering-state-set',
  LightConfigUpdated = 'light-config-updated'
}

export interface ViewerEventPayload {
  [ViewerEvent.ObjectClicked]: SelectionEvent | null
  [ViewerEvent.ObjectDoubleClicked]: SelectionEvent | null
  [ViewerEvent.LoadComplete]: string
  [ViewerEvent.UnloadComplete]: string
  [ViewerEvent.UnloadAllComplete]: void
  [ViewerEvent.Busy]: boolean
  [ViewerEvent.FilteringStateSet]: FilteringState
  [ViewerEvent.LightConfigUpdated]: LightConfiguration
}

export type SpeckleView = SpeckleObject & {
  origin: Vector3Like
  target: Vector3Like
  name?: string
  upDirection?: Vector3Like
  forwardDirection?: Vector3Like
}

export type SelectionEvent = {
  multiple: boolean
  event?: PointerEvent
  hits: Array<{
    node: TreeNode
    point: Vector3
  }>
}

export interface LightConfiguration {
  enabled?: boolean
  castShadow?: boolean
  intensity?: number
  color?: number
  indirectLightIntensity?: number
  shadowcatcher?: boolean
}

export interface SunLightConfiguration extends LightConfiguration {
  elevation?: number
  azimuth?: number
  radius?: number
}

export const DefaultLightConfiguration: SunLightConfiguration = {
  enabled: true,
  castShadow: true,
  intensity: 5,
  color: 0xffffff,
  elevation: 1.33,
  azimuth: 0.75,
  radius: 0,
  indirectLightIntensity: 1.2,
  shadowcatcher: true
}

export enum ObjectLayers {
  STREAM_CONTENT_MESH = 10,
  STREAM_CONTENT_LINE = 11,
  STREAM_CONTENT_POINT = 12,
  STREAM_CONTENT_TEXT = 13,
  STREAM_CONTENT_POINT_CLOUD = 14,

  NONE = 0,
  STREAM_CONTENT = 1,
  PROPS = 2,
  SHADOWCATCHER = 3,
  OVERLAY = 4,
  MEASUREMENTS = 5
}

export enum UpdateFlags {
  RENDER = 0b1,
  SHADOWS = 0b10,
  CLIPPING_PLANES = 0b100,
  RENDER_RESET = 0b1000
}

export interface MaterialOptions {
  stencilOutlines?: StencilOutlineType
  pointSize?: number
  depthWrite?: number
}
export enum StencilOutlineType {
  NONE,
  OVERLAY,
  OUTLINE_ONLY
}

export interface IViewer {
  get Utils(): Utils
  get World(): World

  init(): Promise<void>
  resize(): void
  on<T extends ViewerEvent>(
    eventType: T,
    handler: (arg: ViewerEventPayload[T]) => void
  ): void
  requestRender(flags?: UpdateFlags): void

  setLightConfiguration(config: LightConfiguration): void

  getViews(): SpeckleView[]

  loadObject(loader: Loader, zoomToObject?: boolean): Promise<void>
  cancelLoad(url: string, unload?: boolean): Promise<void>
  unloadObject(url: string): Promise<void>
  unloadAll(): Promise<void>

  screenshot(): Promise<string>

  getObjectProperties(
    resourceURL?: string,
    bypassCache?: boolean
  ): Promise<PropertyInfo[]>

  /** Data ops */
  getWorldTree(): WorldTree
  query<T extends Query>(query: T): QueryArgsResultMap[T['operation']] | null

  getRenderer(): SpeckleRenderer
  getContainer(): HTMLElement

  createExtension<T extends Extension>(type: Constructor<T>): T
  getExtension<T extends Extension>(type: Constructor<T>): T
  hasExtension<T extends Extension>(type: Constructor<T>): boolean
  dispose(): void
}
