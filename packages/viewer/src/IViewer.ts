import { Vector3 } from 'three'
import sampleHdri from './assets/sample-hdri.png'
import { FilteringState } from './modules/filtering/FilteringManager'
import { PropertyInfo } from './modules/filtering/PropertyManager'
import { Query, QueryArgsResultMap, QueryResult } from './modules/queries/Query'
import { DataTree } from './modules/tree/DataTree'
import { Utils } from './modules/Utils'

export interface ViewerParams {
  showStats: boolean
  environmentSrc: Asset | string
  verbose: boolean
  keepGeometryData: boolean
}
export enum AssetType {
  TEXTURE_8BPP = 'png', // For now
  TEXTURE_HDR = 'hdr',
  TEXTURE_EXR = 'exr'
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
  SectionBoxChanged = 'section-box-changed',
  SectionBoxUpdated = 'section-box-updated'
}

export type SelectionEvent = {
  multiple: boolean
  event?: PointerEvent
  hits: Array<{
    guid?: string
    object: Record<string, unknown>
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

export type SpeckleView = {
  name: string
  id: string
  view: Record<string, unknown>
}

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

export interface IViewer {
  init(): Promise<void>
  resize(): void
  on(eventType: ViewerEvent, handler: (arg) => void)
  requestRender(): void
  setSectionBox(
    box?: {
      min: { x: number; y: number; z: number }
      max: { x: number; y: number; z: number }
    },
    offset?: number
  )
  setSectionBoxFromObjects(objectIds: string[], offset?: number)
  getCurrentSectionBox(): {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
  } | null
  toggleSectionBox(): void
  sectionBoxOff(): void
  sectionBoxOn(): void

  zoom(objectIds?: string[], fit?: number, transition?: boolean): void

  toggleCameraProjection(): void
  setLightConfiguration(config: LightConfiguration): void

  getViews(): SpeckleView[]
  setView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition?: boolean
  )

  loadObject(url: string, token?: string, enableCaching?: boolean): Promise<void>
  loadObjectAsync(
    url: string,
    token?: string,
    enableCaching?: boolean,
    priority?: number
  ): Promise<void>
  cancelLoad(url: string, unload?: boolean): Promise<void>
  unloadObject(url: string): Promise<void>
  unloadAll(): Promise<void>

  screenshot(): Promise<string>

  /** Old Filtering members. Deprecated */
  applyFilter(filter: unknown): Promise<void>

  /** New Filtering members */
  getObjectProperties(resourceURL?: string, bypassCache?: boolean): PropertyInfo[]
  showObjects(
    objectIds: string[],
    stateKey?: string,
    includeDescendants?
  ): Promise<FilteringState>
  hideObjects(
    objectIds: string[],
    stateKey?: string,
    includeDescendants?,
    ghost?: boolean
  ): Promise<FilteringState>
  isolateObjects(
    objectIds: string[],
    stateKey?: string,
    includeDescendants?,
    ghost?: boolean
  ): Promise<FilteringState>
  unIsolateObjects(
    objectIds: string[],
    stateKey?: string,
    includeDescendants?
  ): Promise<FilteringState>

  selectObjects(objectIds: string[]): Promise<FilteringState>
  resetSelection(): Promise<FilteringState>
  highlightObjects(objectIds: string[], ghost?: boolean): Promise<FilteringState>
  resetHighlight(): Promise<FilteringState>

  setColorFilter(prop: PropertyInfo, ghost?: boolean): Promise<FilteringState>
  setUserObjectColors(
    groups: [{ objectIds: string[]; color: string }]
  ): Promise<FilteringState>
  removeColorFilter(): Promise<FilteringState>
  resetFilters(): Promise<FilteringState>

  /** Data ops */
  getDataTree(): DataTree
  query<T extends Query>(query: T): QueryArgsResultMap[T['operation']]
  queryAsync(query: Query): Promise<QueryResult>
  get Utils(): Utils

  dispose(): void
}
