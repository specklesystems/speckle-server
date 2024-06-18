import { Vector3 } from 'three'
import { Viewer } from '@speckle/viewer'
import { get } from 'lodash'

export function getCamArray(viewer: Viewer) {
  const controls = viewer.cameraHandler.activeCam.controls
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
    get(controls, '_zoom') as number
  ]
  return c
}
