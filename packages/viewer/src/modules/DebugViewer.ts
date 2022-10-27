import { Viewer } from './Viewer'

export class DebugViewer extends Viewer {
  getRenderer() {
    return this.speckleRenderer
  }

  requestRenderShadowmap() {
    this.getRenderer().updateDirectLights()
  }
}
