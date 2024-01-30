export const useTourStageState = () =>
  useState('viewer-tour-state', () => ({
    showNavbar: true,
    showViewerControls: true,
    showTour: false,
    showSegmentation: true
  }))
