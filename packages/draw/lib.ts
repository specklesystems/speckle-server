import { createPinia } from 'pinia'

// Components
import CanvasInfinite from './components/canvas/Infinite.vue'
import CanvasToolbar from './components/canvas/Toolbar.vue'
import ViewerContainer from './components/viewer/Container.vue'
import ViewerBase from './components/viewer/Base.vue'
import CanvasPaperStaticLayer from './components/canvas/paper/StaticLayer.vue'
import CanvasViewerStaticLayer from './components/canvas/viewer/StaticLayer.vue'
import CanvasViewerContainer from './components/canvas//viewer/Container.vue'

// Stores & composables
export { useObjectDataStore } from './stores/objectDataStore'
export { useViewerStore } from './stores/sharedViewer'
export { useCanvasStore } from './stores/canvas'
export * from './lib/paper'

// Export components for external usage
export {
  CanvasInfinite,
  CanvasToolbar,
  ViewerContainer,
  ViewerBase,
  CanvasPaperStaticLayer,
  CanvasViewerStaticLayer,
  CanvasViewerContainer
}

export function installDraw(app: any) {
  app.use(createPinia())
}
