/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BatchObject, Extension } from '@speckle/viewer'
import { Box3, Euler, Group, Quaternion, Vector3 } from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'

export class XrExtension extends Extension {
  //@ts-ignore
  protected controller: Group

  public init() {
    const renderer = this.viewer.getRenderer().renderer

    document.body.appendChild(ARButton.createButton(renderer))

    this.controller = renderer.xr.getController(0)
    this.controller.addEventListener('select', this.onSelect.bind(this))
    this.viewer.getRenderer().scene.add(this.controller)
  }

  public onSelect() {
    for (const k in this.viewer.getRenderer().batcher.batches)
      this.viewer.getRenderer().batcher.batches[k].renderObject.layers.enableAll()
    const objects = this.viewer.getRenderer().getObjects()

    const unionBox: Box3 = new Box3()
    objects.forEach((obj: BatchObject) => {
      unionBox.union(obj.renderView.aabb || new Box3())
    })
    const origin = unionBox.getCenter(new Vector3())
    objects.forEach((obj: BatchObject) => {
      const pos = new Vector3(0, 40, 20)
      const quat = new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(0, 0, -1)
      )
      pos.applyMatrix4(this.controller.matrixWorld)
      console.log('Res -> ', pos)
      obj.transformTRS(pos, new Euler().setFromQuaternion(quat), undefined, origin)
    })

    console.log('Controller -> ', this.controller.matrixWorld)
  }

  public render() {
    this.viewer.getRenderer().renderer.render(
      this.viewer.getRenderer().scene,
      //@ts-ignore
      this.viewer.getRenderer().renderingCamera
    )
  }
}
