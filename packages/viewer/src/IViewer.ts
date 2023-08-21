import { Vector3 } from 'three'
import sampleHdri from './assets/sample-hdri.png'
import { DiffResult, VisualDiffMode } from './modules/Differ'
import { PropertyInfo } from './modules/filtering/PropertyManager'
import { Query, QueryArgsResultMap, QueryResult } from './modules/queries/Query'
import { DataTree } from './modules/tree/DataTree'
import { TreeNode, WorldTree } from './modules/tree/WorldTree'
import { Utils } from './modules/Utils'
import { World } from './modules/World'
import SpeckleRenderer from './modules/SpeckleRenderer'
import { Extension } from './modules/extensions/core-extensions/Extension'
import Input from './modules/input/Input'

export interface ViewerParams {
  showStats: boolean
  environmentSrc: Asset | string
  verbose: boolean
  keepGeometryData: boolean
}
export enum AssetType {
  TEXTURE_8BPP = 'png', // For now
  TEXTURE_HDR = 'hdr',
  TEXTURE_EXR = 'exr',
  FONT_JSON = 'font-json'
}

export interface Asset {
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
  keepGeometryData: false,
  environmentSrc: {
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

export interface IViewer {
  get input(): Input
  get Utils(): Utils
  get World(): World

  init(): Promise<void>
  resize(): void
  on(eventType: ViewerEvent, handler: (arg) => void)
  requestRender(): void

  setLightConfiguration(config: LightConfiguration): void

  getViews(): SpeckleView[]

  loadObject(
    url: string,
    token?: string,
    enableCaching?: boolean,
    zoomToObject?: boolean
  ): Promise<void>
  loadObjectAsync(
    url: string,
    token?: string,
    enableCaching?: boolean,
    priority?: number,
    zoomToObject?: boolean
  ): Promise<void>
  cancelLoad(url: string, unload?: boolean): Promise<void>
  unloadObject(url: string): Promise<void>
  unloadAll(): Promise<void>

  /** Diffing */
  diff(urlA: string, urlB: string, mode: VisualDiffMode): Promise<DiffResult>
  undiff(): void
  setDiffTime(diffResult: DiffResult, time: number): void
  setVisualDiffMode(diffResult: DiffResult, mode: VisualDiffMode)

  screenshot(): Promise<string>

  getObjectProperties(resourceURL?: string, bypassCache?: boolean): PropertyInfo[]

  /** Data ops */
  getDataTree(): DataTree
  getWorldTree(): WorldTree
  query<T extends Query>(query: T): QueryArgsResultMap[T['operation']]
  queryAsync(query: Query): Promise<QueryResult>

  getRenderer(): SpeckleRenderer
  getContainer(): HTMLElement

  createExtension<T extends Extension>(type: new () => T): T
  getExtension<T extends Extension>(type: new () => T): T

  dispose(): void
}
