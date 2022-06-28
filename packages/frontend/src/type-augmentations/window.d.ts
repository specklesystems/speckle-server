export {}

declare global {
  interface Window {
    /**
     * Initialized in SpeckleViewer.vue
     */
    __viewer?: import('@speckle/viewer').Viewer
  }
}
