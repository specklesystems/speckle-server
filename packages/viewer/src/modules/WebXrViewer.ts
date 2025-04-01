import { PerspectiveCamera } from 'three'
import { Extension } from './extensions/Extension.js'
import { Viewer } from './Viewer.js'
import { ViewerEvent } from '../IViewer.js'

export class WebXrViewer extends Viewer {
  public async init(): Promise<void> {
    await super.init()
    /** Enable auto clearing */
    this.getRenderer().renderer.autoClear = true
    this.getRenderer().renderer.autoClearColor = true
    this.getRenderer().renderer.autoClearDepth = true
    this.getRenderer().renderer.autoClearStencil = true

    /** Enable WebXr */
    this.getRenderer().renderer.xr.enabled = true
    /** Set the animation loop to ours */
    this.getRenderer().renderer.setAnimationLoop(this.xrWrappedRender.bind(this))

    /** Whenever we load something, enable all layers so it always gets rendered */
    this.on(ViewerEvent.LoadComplete, () => {
      for (const k in this.getRenderer().batcher.batches)
        this.getRenderer().batcher.batches[k].renderObject.layers.enableAll()
    })
  }

  /** Override the render function an don't call SpeckleRendere's render */
  protected render() {
    Object.values(this.extensions).forEach((ext: Extension) => {
      ext.onRender()
    })
  }

  /** Rendering is now done on three's WebXr loop
   *  We also just render plainly, no pipelines, for simplicity
   */
  protected xrWrappedRender() {
    const renderer = this.getRenderer().renderer
    const camera = this.getRenderer().renderingCamera as PerspectiveCamera
    const storeLayers = camera.layers.mask
    camera.layers.enableAll()
    renderer.render(this.getRenderer().scene, camera)
    camera.layers.set(storeLayers)
  }
}
