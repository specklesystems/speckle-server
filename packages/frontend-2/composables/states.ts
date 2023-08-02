export const useTextInputGlobalFocus = () =>
  useState<boolean>('text-input-focus', () => false)

export const useTourStageState = () =>
  useState('global-ui-element-state', () => ({
    showNavbar: true,
    showViewerControls: true,
    showTour: false
  }))
