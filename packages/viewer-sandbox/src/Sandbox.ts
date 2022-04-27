import { Viewer } from '@speckle/viewer'
import { Pane } from 'tweakpane'
import UrlHelper from './UrlHelper'

export default class Sandbox {
  private viewer: Viewer
  private pane: Pane
  private __resUrl!: object

  public constructor(viewer: Viewer) {
    this.viewer = viewer
    this.pane = new Pane({ title: 'Sandbox', expanded: true })
  }

  public makeGenericUI() {
    this.__resUrl = {
      url:
        localStorage.getItem('last-load-url') ||
        'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
    }
    this.pane.addInput(this.__resUrl, 'url')

    const loadButton = this.pane.addButton({
      title: 'Load Url'
    })

    loadButton.on('click', () => {
      this.loadUrl(this.__resUrl.url)
    })

    const clearButton = this.pane.addButton({
      title: 'Clear All'
    })

    clearButton.on('click', () => {
      this.viewer.unloadAll()
    })
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
