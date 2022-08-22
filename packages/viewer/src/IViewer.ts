import { Vector3 } from 'three'
import sampleHdri from './assets/sample-hdri.png'

export interface ViewerParams {
  postprocessing: boolean
  reflections: boolean
  showStats: boolean
  environmentSrc: Asset | string
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
  postprocessing: false,
  reflections: true,
  showStats: false,
  environmentSrc: {
    src: sampleHdri,
    type: AssetType.TEXTURE_EXR
  }
}

export type SelectionEvent = {
  userData: Record<string, unknown>
  location: Vector3
  selectionCenter: Vector3
  multiple: boolean
}

export interface LightConfiguration {
  enabled?: boolean
  castShadow?: boolean
  intensity?: number
  color?: number
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
  elevation: 0.47,
  azimuth: 0,
  radius: 0
}

/**
 * Carried over from the old Viewer. To be extended/changed
 */
export interface IViewer {
  init(): Promise<void>
  toggleSectionBox(): void
  sectionBoxOff(): void
  sectionBoxOn(): void
  zoomExtents(fit?: number, transition?: boolean): void
  toggleCameraProjection(): void
  setLightConfiguration(config: LightConfiguration): void

  getViews()
  setView(id: string, transition: boolean)
  // This shouldn't be part of the API, it should be handled through `setView`
  rotateTo(side: string, transition: boolean)

  loadObject(url: string, token?: string, enableCaching?: boolean): Promise<void>
  cancelLoad(url: string, unload?: boolean): Promise<void>
  unloadObject(url: string): Promise<void>
  unloadAll(): Promise<void>

  screenshot(): Promise<string>

  applyFilter(filter: unknown): Promise<void>
  getObjectsProperties(includeAll?: boolean): unknown

  dispose(): void
}
