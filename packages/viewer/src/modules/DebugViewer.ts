import { Viewer } from './Viewer'

export class DebugViewer extends Viewer {
  getRenderer() {
    return this.speckleRenderer
  }
  requestRender() {
    this.needsRender = true
  }
}
