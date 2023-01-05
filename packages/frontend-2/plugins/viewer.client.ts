import { Viewer, DefaultViewerParams } from '@speckle/viewer'

let viewer: Viewer
let viewerInitialisePromise: Promise<Viewer>
let container: HTMLElement

let viewerIsInitialised = false

export default defineNuxtPlugin(() => {
  if (!container) {
    container = document.createElement('div')
    container.id = 'renderer'
    container.className = 'viewer-container'
    container.style.width = '100%'
    container.style.height = '100%'

    viewer = new Viewer(container, DefaultViewerParams)
    viewerInitialisePromise = new Promise<Viewer>((resolve) => {
      if (viewerIsInitialised) {
        resolve(viewer)
        return
      }

      viewer.init().then(() => {
        viewerIsInitialised = true
        resolve(viewer)
      })
    })
  }

  return {
    provide: {
      viewer: viewerInitialisePromise,
      viewerContainer: container
    }
  }
})
