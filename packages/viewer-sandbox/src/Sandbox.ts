import { Viewer, IViewer } from '@speckle/viewer'
import { Pane } from 'tweakpane'
import UrlHelper from './UrlHelper'

export default class Sandbox {
  private viewer: IViewer
  private pane: Pane
  private tabs: any

  private static urlParams = {
    url: 'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
  }

  private static sceneParams = {
    exposure: 0.4,
    tonemapping: 'Linear'
  }

  public constructor(viewer: IViewer) {
    this.viewer = viewer
    this.pane = new Pane({ title: 'Sandbox', expanded: true })
    this.pane['containerElem_'].style.width = "300px";
    const t = `matrix(1.2, 0, 0, 1.2, -25, 16)`
    this.pane['containerElem_'].style.transform = t;
    this.tabs = this.pane.addTab({
      pages: [
        {title: 'General'},
        {title: 'Scene'},
      ],
    });
  }

  public makeGenericUI() {
    this.tabs.pages[0].addInput(Sandbox.urlParams, 'url', {
      title: 'url'
    })

    const loadButton = this.tabs.pages[0].addButton({
      title: 'Load Url'
    })

    loadButton.on('click', () => {
      this.loadUrl(Sandbox.urlParams.url)
    })

    const clearButton = this.tabs.pages[0].addButton({
      title: 'Clear All'
    })

    clearButton.on('click', () => {
      this.viewer.unloadAll()
    })

    this.tabs.pages[0].addSeparator();
    
    const toggleSectionBox = this.tabs.pages[0].addButton({
      title: "Toggle Section Box"
    })
    toggleSectionBox.on('click', () => {
      this.viewer.toggleSectionBox()
    })

    const toggleProjection = this.tabs.pages[0].addButton({
      title: 'Toggle Projection'
    })
    toggleProjection.on('click', () => {
      this.viewer.toggleCameraProjection()
    })

    const zoomExtents = this.tabs.pages[0].addButton({
      title: 'Zoom Extents'
    })
    zoomExtents.on('click', () => {
      this.viewer.zoomExtents(undefined, true)
    })
  }

  makeSceneUI() {
    const postFolder = this.tabs.pages[1].addFolder({
      title: "Post",
      expanded: true
    });

    postFolder.addInput(Sandbox.sceneParams, 'exposure', {
      min: 0,
      max: 1,
    }).on('change', (ev: any) => {
      this.viewer.renderer.toneMappingExposure = Sandbox.sceneParams.exposure;
    });

    postFolder.addInput(Sandbox.sceneParams, 'tonemapping', {
      options: {
          Linear: 1,
          ACES: 4
      }
    }).on('change', (ev: any) => {
        this.viewer.renderer.toneMapping = Sandbox.sceneParams.tonemapping
    });

    
  }

  public async loadUrl(url: string) {
    const objUrls = await UrlHelper.getResourceUrls(url)
    for (const url of objUrls) {
      console.log(`Loading ${url}`)
      await this.viewer.loadObject(url)
    }
    localStorage.setItem('last-load-url', url)
  }
}
