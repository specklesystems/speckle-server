import { Matrix4, Vector3, WebGLRenderer } from 'three'

export class SpeckleWebGLRenderer extends WebGLRenderer {
  public RTEBuffers = {
    viewer: new Vector3(),
    viewerLow: new Vector3(),
    viewerHigh: new Vector3(),
    rteViewModelMatrix: new Matrix4(),

    shadowViewer: new Vector3(),
    shadowViewerLow: new Vector3(),
    shadowViewerHigh: new Vector3(),
    rteShadowViewModelMatrix: new Matrix4(),
    rteShadowMatrix: new Matrix4()
  }
}
