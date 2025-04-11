/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BatchObject, Extension, ViewerEvent } from '@speckle/viewer'
import { Euler, Group, Quaternion, Vector3 } from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'

export class XrExtension extends Extension {
  //@ts-ignore
  protected controller: Group

  public init() {
    const renderer = this.viewer.getRenderer().renderer
    this.viewer.on(ViewerEvent.LoadComplete, () => {
      document.body.appendChild(ARButton.createButton(renderer))
    })

    this.controller = renderer.xr.getController(0)
    this.controller.addEventListener('select', this.onSelect.bind(this))
    this.viewer.getRenderer().scene.add(this.controller)
  }

  public onSelect() {
    /** Get the objects */
    const objects = this.viewer.getRenderer().getObjects()

    /** Model's origin will be our transform origin */
    const origin = new Vector3().copy(this.viewer.World.worldOrigin)

    /** Moving to the object's origin */
    const pos = new Vector3().copy(this.viewer.World.worldOrigin).negate()

    /** Speckle CS is Z up, three assumes Y up */
    const quat = new Quaternion()
      .setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, -1))
      .premultiply(new Quaternion().setFromRotationMatrix(this.controller.matrixWorld))
    pos.applyMatrix4(this.controller.matrixWorld)

    /** Apply transform */
    objects.forEach((obj: BatchObject) => {
      obj.transformTRS(pos, new Euler().setFromQuaternion(quat), undefined, origin)
    })
  }
}
