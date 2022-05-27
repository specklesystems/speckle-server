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

export const DefaultViewerParams: ViewerParams = {
  postprocessing: false,
  reflections: true,
  showStats: true,
  environmentSrc: {
    src: sampleHdri,
    type: AssetType.TEXTURE_EXR
  }
}
/**
 * Carried over from the old Viewer. To be extended/changed
 */
export interface IViewer {
  init(): Promise<void>
  toggleSectionBox(): void
  sectionBoxOff(): void
  sectionBoxOn(): void
  zoomExtents(fit: number, transition: boolean): void
  toggleCameraProjection(): void

  loadObject(url: string, token?: string, enableCaching?: boolean): Promise<void>
  cancelLoad(url: string, unload?: boolean): Promise<void>
  unloadObject(url: string): Promise<void>
  unloadAll(): Promise<void>

  applyFilter(filter: unknown): Promise<unknown>
  getObjectsProperties(includeAll?: boolean): unknown

  dispose(): void
}
