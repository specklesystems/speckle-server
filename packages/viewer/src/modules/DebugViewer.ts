import { Viewer } from './Viewer'

export class DebugViewer extends Viewer {
  requestRenderShadowmap() {
    this.getRenderer().updateDirectLights()
    this.requestRender()
  }
}
