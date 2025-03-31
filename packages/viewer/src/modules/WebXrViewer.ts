import { PerspectiveCamera } from 'three'
import { Extension } from './extensions/Extension.js'
import { Viewer } from './Viewer.js'

export class WebXrViewer extends Viewer {
  public async init(): Promise<void> {
    await super.init()
    this.getRenderer().renderer.autoClear = true
    this.getRenderer().renderer.autoClearColor = true
    this.getRenderer().renderer.autoClearDepth = true
    this.getRenderer().renderer.autoClearStencil = true

    this.getRenderer().renderer.xr.enabled = true
    this.getRenderer().renderer.setAnimationLoop(this.xrWrappedRender.bind(this))
  }
  protected render() {
    Object.values(this.extensions).forEach((ext: Extension) => {
      ext.onRender()
    })
  }

  protected xrWrappedRender() {
    const renderer = this.getRenderer().renderer
    const camera = this.getRenderer().renderingCamera as PerspectiveCamera
    const storeLayers = camera.layers.mask
    camera.layers.enableAll()
    renderer.render(this.getRenderer().scene, camera)
    camera.layers.set(storeLayers)
  }
}
