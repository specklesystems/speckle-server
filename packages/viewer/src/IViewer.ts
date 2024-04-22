import { Vector3 } from 'three'
import sampleHdri from './assets/sample-hdri.png'
import { PropertyInfo } from './modules/filtering/PropertyManager'
import { Query, QueryArgsResultMap, QueryResult } from './modules/queries/Query'
import { DataTree } from './modules/tree/DataTree'
import { TreeNode, WorldTree } from './modules/tree/WorldTree'
import { Utils } from './modules/Utils'
import { World } from './modules/World'
import SpeckleRenderer from './modules/SpeckleRenderer'
import { Extension } from './modules/extensions/Extension'
import Input from './modules/input/Input'
import { Loader } from './modules/loaders/Loader'
import { type Constructor } from 'type-fest'

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
    src: sampleHdri,
    type: AssetType.TEXTURE_EXR
  }
}

export enum ViewerEvent {
  ObjectClicked = 'object-clicked',
  ObjectDoubleClicked = 'object-doubleclicked',
  DownloadComplete = 'download-complete',
  LoadComplete = 'load-complete',
  LoadProgress = 'load-progress',
  UnloadComplete = 'unload-complete',
  LoadCancelled = 'load-cancelled',
  UnloadAllComplete = 'unload-all-complete',
  Busy = 'busy',
  FilteringStateSet = 'filtering-state-set',
  LightConfigUpdated = 'light-config-updated'
}

export type SpeckleView = {
  name: string
  id: string
  view: Record<string, unknown>
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
  CLIPPING_PLANES = 0b100
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
  get input(): Input
  get Utils(): Utils
  get World(): World

  init(): Promise<void>
  resize(): void
  on(eventType: ViewerEvent, handler: (arg) => void)
  requestRender(flags?: number): void

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
  getDataTree(): DataTree
  getWorldTree(): WorldTree
  query<T extends Query>(query: T): QueryArgsResultMap[T['operation']]
  queryAsync(query: Query): Promise<QueryResult>

  getRenderer(): SpeckleRenderer
  getContainer(): HTMLElement

  createExtension<T extends Extension>(type: Constructor<T>): T
  getExtension<T extends Extension>(type: Constructor<T>): T

  dispose(): void
}
