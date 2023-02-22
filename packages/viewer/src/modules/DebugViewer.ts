import { WorldTree } from './tree/WorldTree'
import { Viewer } from './Viewer'

export class DebugViewer extends Viewer {
  getRenderer() {
    return this.speckleRenderer
  }

  requestRenderShadowmap() {
    this.getRenderer().updateDirectLights()
  }

  getWorldTree() {
    return WorldTree.getInstance()
  }
}
