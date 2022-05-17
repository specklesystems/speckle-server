export interface ViewerParams {
  postprocessing: boolean
  reflections: boolean
  showStats: boolean
}

export const DefaultViewerParams: ViewerParams = {
  postprocessing: false,
  reflections: true,
  showStats: true
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

  applyFilter(filter: any): Promise<any>
  getObjectsProperties(includeAll?: boolean): any

  dispose(): void
}
