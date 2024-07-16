import { Camera, Matrix4, Vector3, WebGLRenderer } from 'three'
import { Geometry } from '../converter/Geometry.js'
export class RTEBuffers {
  private _cache: RTEBuffers | undefined

  viewer: Vector3 = new Vector3()
  viewerLow: Vector3 = new Vector3()
  viewerHigh: Vector3 = new Vector3()
  rteViewModelMatrix: Matrix4 = new Matrix4()

  shadowViewer: Vector3 = new Vector3()
  shadowViewerLow: Vector3 = new Vector3()
  shadowViewerHigh: Vector3 = new Vector3()
  rteShadowViewModelMatrix: Matrix4 = new Matrix4()
  rteShadowMatrix: Matrix4 = new Matrix4()

  copy(from: RTEBuffers, to: RTEBuffers) {
    to.viewer.copy(from.viewer)
    to.viewerLow.copy(from.viewerLow)
    to.viewerHigh.copy(from.viewerHigh)
    to.rteViewModelMatrix.copy(from.rteViewModelMatrix)

    to.shadowViewer.copy(from.shadowViewer)
    to.shadowViewerLow.copy(from.shadowViewerLow)
    to.shadowViewerHigh.copy(from.shadowViewerHigh)
    to.rteShadowViewModelMatrix.copy(from.rteShadowViewModelMatrix)
    to.rteShadowMatrix.copy(from.rteShadowMatrix)
  }

  push() {
    if (!this._cache) this._cache = new RTEBuffers()
    this.copy(this, this._cache)
  }

  pop() {
    if (!this._cache) this._cache = new RTEBuffers()
    this.copy(this._cache, this)
  }
}

export class SpeckleWebGLRenderer extends WebGLRenderer {
  public RTEBuffers = new RTEBuffers()

  updateRTEViewModel(camera: Camera) {
    this.RTEBuffers.rteViewModelMatrix.copy(camera.matrixWorldInverse)
    this.RTEBuffers.rteViewModelMatrix.elements[12] = 0
    this.RTEBuffers.rteViewModelMatrix.elements[13] = 0
    this.RTEBuffers.rteViewModelMatrix.elements[14] = 0

    this.RTEBuffers.viewer.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      this.RTEBuffers.viewer,
      this.RTEBuffers.viewerLow,
      this.RTEBuffers.viewerHigh
    )
  }
}
