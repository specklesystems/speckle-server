export {}

declare global {
  interface Window {
    /**
     * Initialized in SpeckleViewer.vue
     */
    __viewer?: import('@speckle/viewer').Viewer

    /**
     * Set, if SpeckleLocalStorage used without available LocalStorage
     */
    fakeLocalStorage?: Storage
  }
}
