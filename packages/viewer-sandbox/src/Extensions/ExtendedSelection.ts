import { UpdateFlags } from '@speckle/viewer'
import { ObjectLayers, SelectionEvent, SelectionExtension } from '@speckle/viewer'
import { Object3D, Vector3, Box3 } from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

export class ExtendedSelection extends SelectionExtension {
  /** This object will recieve the TransformControls translation */
  private dummyAnchor: Object3D = new Object3D()
  /** Stock three.js gizmo */
  private transformControls: TransformControls | undefined
  private lastGizmoTranslation: Vector3 = new Vector3()

  public init() {
    /** We set the layers to PROPS so that the viewer regular pipeline ignores it */
    this.dummyAnchor.layers.set(ObjectLayers.PROPS)
    this.viewer.getRenderer().scene.add(this.dummyAnchor)
    this.initGizmo()
  }

  public selectObjects(ids: Array<string>, multiSelect = false) {
    super.selectObjects(ids, multiSelect)
    this.updateGizmo(ids.length ? true : false)
  }

  protected onObjectClicked(selection: SelectionEvent) {
    /** Do whatever the base extension is doing */
    super.onObjectClicked(selection)
    /** Update the anchor and gizmo location */
    this.updateGizmo(selection ? true : false)
  }

  private initGizmo() {
    const camera = this.viewer.getRenderer().renderingCamera
    if (!camera) {
      throw new Error('Cannot init move gizmo with no camera')
    }
    /** Create a new TransformControls gizmo */
    this.transformControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    /** The gizmo creates an entire hierarchy of children internally,
     *  and three.js objects do not inherit parent layer values, so
     *  we must set all the child gizmo objects to the desired layer manually
     */
    for (let k = 0; k < this.transformControls.children.length; k++) {
      this.transformControls.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    /** Set the raycaster's layer as well */
    this.transformControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    /** We set the overall gizmo size */
    this.transformControls.setSize(0.5)

    /** These are the TransformControls events */
    this.transformControls.addEventListener('change', () => {
      /** We request a render each time we interact with the gizmo */
      this.viewer.requestRender()
    })
    this.transformControls.addEventListener('dragging-changed', (event) => {
      /** When we start dragging the gizmo, we disable the camera controls
       *  and re-enable them once we're done
       */
      const val = !!event.value
      if (val) {
        this.cameraProvider.enabled = !val
      } else {
        setTimeout(() => {
          this.cameraProvider.enabled = !val
        }, 100)
      }
    })
    this.transformControls.addEventListener(
      'objectChange',
      this.onAnchorChanged.bind(this)
    )

    /** We add the gizmo to the scene */
    this.viewer.getRenderer().scene.add(this.transformControls)
  }

  /** This positions the anchor and gizmo to the center of the selected objects
   *  bounds. Note that a single selection might yield multiple individual objects
   *  to getting selected
   */
  private updateGizmo(attach: boolean) {
    const box = new Box3()
    for (const k in this.selectionRvs) {
      const batchObject = this.viewer.getRenderer().getObject(this.selectionRvs[k])
      if (!batchObject) continue
      box.union(batchObject.aabb)
    }
    const center = box.getCenter(new Vector3())
    this.dummyAnchor.position.copy(center)
    this.lastGizmoTranslation.copy(this.dummyAnchor.position)
    if (this.transformControls) {
      if (attach) {
        this.transformControls.attach(this.dummyAnchor)
      } else {
        this.transformControls.detach()
      }
    }
  }

  /** This is where the transformation gets applied */
  private onAnchorChanged() {
    /** We get the bounds of the entire group on rvs, since clicking
     *  on a single object might yield multiple objects (hosted elements,
     *  multiple display values, etc)
     */
    // const box = new Box3()
    // for (const k in this.selectionRvs) {
    //   box.union(this.selectionRvs[k].aabb)
    // }
    // /** We get the center of the accumulated box */
    // const center = box.getCenter(new Vector3())

    for (const k in this.selectionRvs) {
      const batchObject = this.viewer.getRenderer().getObject(this.selectionRvs[k])
      /** Only objects of type mesh can have batch objects.
       *  Lines and points do not
       */
      if (!batchObject) continue
      /** This is where we moved the gizmo to */
      const anchorPos = new Vector3().copy(this.dummyAnchor.position)
      const anchorPosDelta = anchorPos.sub(this.lastGizmoTranslation)
      /** We subtract the group's bounds center, to keep individual object
       *  offsets consistent
       */
      // anchorPos.sub(center)
      /** Apply the transformation */
      batchObject.transformTRS(
        anchorPosDelta.add(batchObject.translation),
        undefined,
        undefined,
        undefined
      )
    }
    this.lastGizmoTranslation.copy(this.dummyAnchor.position)
    this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
  }
}
