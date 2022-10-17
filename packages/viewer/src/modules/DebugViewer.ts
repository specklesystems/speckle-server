import { Viewer } from './Viewer'

export class DebugViewer extends Viewer {
  getRenderer() {
    return this.speckleRenderer
  }
  requestRender() {
    this.speckleRenderer.needsRender = true
  }
  requestRenderShadowmap() {
    this.getRenderer().updateDirectLights()
  }
}
