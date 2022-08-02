import { Vector3 } from 'three'
import { Viewer } from '@speckle/viewer'
import CameraControls from 'camera-controls'

// we're relying on a private property here, which we shouldn't do
// (I'm just migrating the function over from a previous file, I didn't write it)
type RealCameraControls = CameraControls & { _zoom: number }

export function getCamArray(viewer: Viewer) {
  const controls = viewer.cameraHandler.activeCam.controls as RealCameraControls
  const pos = controls.getPosition(new Vector3())
  const target = controls.getTarget(new Vector3())
  const c = [
    parseFloat(pos.x.toFixed(5)),
    parseFloat(pos.y.toFixed(5)),
    parseFloat(pos.z.toFixed(5)),
    parseFloat(target.x.toFixed(5)),
    parseFloat(target.y.toFixed(5)),
    parseFloat(target.z.toFixed(5)),
    viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
    controls._zoom
  ]
  return c
}
