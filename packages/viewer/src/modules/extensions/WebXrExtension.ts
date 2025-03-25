import { CylinderGeometry, Group, Mesh, MeshBasicMaterial } from 'three'
import { Extension } from './Extension.js'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'

export class WebXrExtension extends Extension {
  protected controller: Group

  public init() {
    const renderer = this.viewer.getRenderer().renderer

    document.body.appendChild(ARButton.createButton(renderer))

    renderer.xr.enabled = true
    renderer.setAnimationLoop(
      this.viewer.getRenderer().update.bind(this.viewer.getRenderer())
    )

    this.controller = renderer.xr.getController(0)
    this.controller.addEventListener('select', this.onSelect.bind(this))
    this.viewer.getRenderer().scene.add(this.controller)
  }

  public onSelect() {
    const geometry = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(Math.PI / 2)
    const material = new MeshBasicMaterial({
      color: 0xffffff * Math.random()
    })
    const mesh = new Mesh(geometry, material)
    mesh.position.set(0, 0, -0.3).applyMatrix4(this.controller.matrixWorld)
    mesh.quaternion.setFromRotationMatrix(this.controller.matrixWorld)
    this.viewer.getRenderer().scene.add(mesh)
  }
}
