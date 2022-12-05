import {
  Viewer,
  DefaultViewerParams,
  SelectionEvent,
  ViewerEvent
} from '@speckle/viewer'

type GlobalViewerData = {
  viewer: Viewer
  container: HTMLElement
}

let globalViewerData: GlobalViewerData | null = null

export async function getOrInitViewer(art = ''): Promise<GlobalViewerData> {
  console.log('ginitviewer', !!globalViewerData, art)
  if (globalViewerData) return globalViewerData

  const container = document.createElement('div')
  container.id = 'renderer'
  container.className = 'viewer-container'
  container.style.width = '100%'
  container.style.height = '100%'
  const viewer = new Viewer(container, DefaultViewerParams)

  await viewer.init()
  globalViewerData = {
    viewer,
    container
  }

  return globalViewerData
}
