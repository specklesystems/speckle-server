export function getCamArray() {
  let controls = window.__viewer.cameraHandler.activeCam.controls
  let pos = controls.getPosition()
  let target = controls.getTarget()
  let c = [
    parseFloat(pos.x.toFixed(5)),
    parseFloat(pos.y.toFixed(5)),
    parseFloat(pos.z.toFixed(5)),
    parseFloat(target.x.toFixed(5)),
    parseFloat(target.y.toFixed(5)),
    parseFloat(target.z.toFixed(5)),
    window.__viewer.cameraHandler.activeCam.name === 'ortho' ? 1 : 0,
    controls._zoom
  ]
  return c
}
