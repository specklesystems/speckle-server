// TODO: JUST A TEST, REMOVE SO WE DON'T BUNDLE IT! This image is only going to be bundled, if imported, unlike
// everything in 'always-bundled-assets'. Also unlike those, the filename for these is going
// to be changed with a hash while assets in 'always-bundled-assets' remain with the same names
import RandomImportThing from './assets/only-bundled-if-imported.png'

export interface ViewerParams {
  postprocessing: boolean
  reflections: boolean
  showStats: boolean
  environmentSrc: string
}

export const DefaultViewerParams: ViewerParams = {
  postprocessing: false,
  reflections: true,
  showStats: true,
  environmentSrc: RandomImportThing
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
