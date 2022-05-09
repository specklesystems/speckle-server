export interface ViewerParams {
    postprocessing: boolean;
    reflections: boolean;
    showStats: boolean;
}

export const DefaultViewerParams: ViewerParams = {
    postprocessing: false,
    reflections: true,
    showStats: true
};
/**
 * Carried over from the old Viewer. To be extended/changed
 */
export interface IViewer {
    toggleSectionBox();
    sectionBoxOff();
    sectionBoxOn();
    zoomExtents(fit: number, transition: boolean);
    toggleCameraProjection();
}
