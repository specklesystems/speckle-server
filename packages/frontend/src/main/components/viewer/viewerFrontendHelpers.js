export function getCamArray() {
  const controls = window.__viewer.cameraHandler.activeCam.controls
  const pos = controls.getPosition()
  const target = controls.getTarget()
  const c = [
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
