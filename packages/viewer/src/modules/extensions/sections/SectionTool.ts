/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Group,
  Box3,
  BufferGeometry,
  Mesh,
  Vector3,
  Plane,
  BufferAttribute,
  Raycaster,
  DoubleSide,
  Quaternion,
  Object3D,
  Matrix4,
  Matrix3,
  Vector2,
  Intersection,
  Face,
  InterleavedBufferAttribute,
  DynamicDrawUsage,
  Color,
  MeshBasicMaterial,
  PlaneGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute
} from 'three'
import { intersectObjectWithRay, TransformControls } from '../TransformControls.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'
import { type IViewer, ObjectLayers } from '../../../IViewer.js'
import { CameraController } from '../CameraController.js'

import { InputEvent } from '../../input/Input.js'
import { Vector3Like } from '../../batching/BatchObject.js'
import Logger from '../../utils/Logger.js'
import { World } from '../../World.js'
import { CameraEvent } from '../../objects/SpeckleCamera.js'

import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { Geometry } from '../../converter/Geometry.js'
import SpeckleLineMaterial from '../../materials/SpeckleLineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import SpeckleStandardMaterial from '../../materials/SpeckleStandardMaterial.js'
import { Extension } from '../Extension.js'

export enum SectionToolEvent {
  DragStart = 'section-box-drag-start',
  DragEnd = 'section-box-drag-end',
  Updated = 'section-box-changed'
}

export interface SectionToolEventPayload {
  [SectionToolEvent.DragStart]: void
  [SectionToolEvent.DragEnd]: void
  [SectionToolEvent.Updated]: Plane[]
}

/** Buffers */
const _matrix4 = new Matrix4()
const _quaternion = new Quaternion()
const _vector3 = new Vector3()

const unitCube = new Float32Array([
  -1 * 0.5,
  -1 * 0.5,
  -1 * 0.5,

  1 * 0.5,
  -1 * 0.5,
  -1 * 0.5,

  1 * 0.5,
  1 * 0.5,
  -1 * 0.5,

  -1 * 0.5,
  1 * 0.5,
  -1 * 0.5,

  -1 * 0.5,
  -1 * 0.5,
  1 * 0.5,

  1 * 0.5,
  -1 * 0.5,
  1 * 0.5,

  1 * 0.5,
  1 * 0.5,
  1 * 0.5,

  -1 * 0.5,
  1 * 0.5,
  1 * 0.5
])

const unitCubeIndices: Uint16Array = new Uint16Array([
  0, 1, 3, 3, 1, 2, 1, 5, 2, 2, 5, 6, 5, 4, 6, 6, 4, 7, 4, 0, 7, 7, 0, 3, 3, 2, 7, 7, 2,
  6, 4, 5, 0, 0, 5, 1
])

const unitCubeEdges: number[] = [
  // Bottom Face
  -0.5, -0.5, -0.5, 0.5, -0.5, -0.5,

  0.5, -0.5, -0.5, 0.5, 0.5, -0.5,

  0.5, 0.5, -0.5, -0.5, 0.5, -0.5,

  -0.5, 0.5, -0.5, -0.5, -0.5, -0.5,

  // Top Face
  -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,

  0.5, -0.5, 0.5, 0.5, 0.5, 0.5,

  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

  -0.5, 0.5, 0.5, -0.5, -0.5, 0.5,

  // Sides
  -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,

  0.5, -0.5, 0.5, 0.5, -0.5, -0.5,

  0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

  -0.5, 0.5, 0.5, -0.5, 0.5, -0.5
]

const scratchArray: number[] = new Array(unitCubeEdges.length)
const scratchPlaneArray: number[] = new Array(12)

export class SectionTool extends Extension {
  public get inject() {
    return [CameraController]
  }

  /** This is our data model. All we need is an OBB */
  protected obb: OBB = new OBB()

  /** The planes that will send out as clipping planes */
  protected planes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), 0.5),
    new Plane(new Vector3(-1, 0, 0), 0.5),
    new Plane(new Vector3(0, 1, 0), 0.5),
    new Plane(new Vector3(0, -1, 0), 0.5),
    new Plane(new Vector3(0, 0, 1), 0.5),
    new Plane(new Vector3(0, 0, -1), 0.5)
  ]
  /** The six planes of the unit cube */
  protected localPlanes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), 0.5),
    new Plane(new Vector3(-1, 0, 0), 0.5),
    new Plane(new Vector3(0, 1, 0), 0.5),
    new Plane(new Vector3(0, -1, 0), 0.5),
    new Plane(new Vector3(0, 0, 1), 0.5),
    new Plane(new Vector3(0, 0, -1), 0.5)
  ]

  /** Convenience LUT for when clicking on the box faces */
  protected cubeFaces =
    // prettier-ignore
    {
    '256': { verts: [1, 2, 5, 6], axis: 'x', normal: new Vector3(1, 0, 0) },
    '152': { verts: [1, 2, 5, 6], axis: 'x', normal: new Vector3(1, 0, 0) },
    '407': { verts: [0, 3, 4, 7], axis: 'x', normal: new Vector3(1, 0, 0) },
    '703': { verts: [0, 3, 4, 7], axis: 'x', normal: new Vector3(1, 0, 0) },
    '327': { verts: [2, 3, 6, 7], axis: 'y', normal: new Vector3(0, 1, 0) },
    '726': { verts: [2, 3, 6, 7], axis: 'y', normal: new Vector3(0, 1, 0) },
    '450': { verts: [0, 1, 4, 5], axis: 'y', normal: new Vector3(0, 1, 0) },
    '051': { verts: [0, 1, 4, 5], axis: 'y', normal: new Vector3(0, 1, 0) },
    '312': { verts: [0, 1, 3, 2], axis: 'z', normal: new Vector3(0, 0, 1) },
    '013': { verts: [0, 1, 3, 2], axis: 'z', normal: new Vector3(0, 0, 1) },
    '546': { verts: [4, 5, 7, 6], axis: 'z', normal: new Vector3(0, 0, 1) },
    '647': { verts: [4, 5, 7, 6], axis: 'z', normal: new Vector3(0, 0, 1) }
  }

  /** The root object  */
  protected display: Group
  /** We only use this for hit testing to select it's faces */
  protected boxHitMesh: Mesh
  /** The displayed box as an outline */
  protected boxOutline: LineSegments2
  /** Mesh that gets shown across a box face when it gets selected */
  protected facePlane: Mesh

  /** Anchor objects for the controls. Not displayable */
  protected translationRotationAnchor: Object3D
  protected scaleAnchor: Object3D

  /** Controls instances */
  protected translateControls: TransformControls
  protected rotateControls: TransformControls
  protected scaleControls: TransformControls

  /** Sum state */
  protected lastScale: Vector3 | null
  protected lastObbTransform: Matrix4 = new Matrix4()
  protected draggingFace: Face | null

  /** Hit testing related */
  protected raycaster: Raycaster
  protected dragging = false

  /** Manadatory property for all extensions */
  public get enabled() {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
    this.display.visible = value
    if (value) {
      this.translateControls.attach(this.translationRotationAnchor)
      this.rotateControls.attach(this.translationRotationAnchor)
    } else {
      this.translateControls.detach()
      this.rotateControls.detach()
      this.scaleControls.detach()
      this.draggingFace = null
      this.facePlane.visible = false
    }
    this.viewer.getRenderer().renderer.localClippingEnabled = value
    this.emit(SectionToolEvent.Updated, this.planes)
    this.viewer.requestRender()
  }

  /** Hides all controls and the box outline but keeps the sections enabled */
  public get visible(): boolean {
    return this.display.visible
  }

  public set visible(value: boolean) {
    if (!this._enabled) return

    this.display.visible = value
    if (value) {
      this.translateControls.attach(this.translationRotationAnchor)
      this.rotateControls.attach(this.translationRotationAnchor)
      if (this.draggingFace) this.scaleControls.attach(this.scaleAnchor)
    } else {
      this.translateControls.detach()
      this.rotateControls.detach()
      if (this.draggingFace) this.scaleControls.detach()
    }
  }

  /** Gets the up to date section planes */
  public get sectionPlanes(): Plane[] {
    return this.planes
  }

  /**
   *
   */

  constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer, cameraProvider)
    this.viewer = viewer

    this.dragging = false
    this.display = new Group()
    this.display.name = 'SectionBox'
    this.display.layers.set(ObjectLayers.PROPS)
    this.viewer.getRenderer().scene.add(this.display)

    /** Create the hit box. It never gets rendered */
    const boxGeometry = this.createCubeGeometry()
    this.boxHitMesh = new Mesh(
      boxGeometry,
      new MeshBasicMaterial({
        side: DoubleSide,
        visible: false,
        depthWrite: false
      })
    )
    this.boxHitMesh.layers.set(ObjectLayers.PROPS)
    this.display.add(this.boxHitMesh)

    /** Create the displayable box outline */
    this.boxOutline = this.createOutline()
    this.display.add(this.boxOutline)

    /** Create the box face highlight mesh */
    this.facePlane = this.createFacePlane()
    this.display.add(this.facePlane)

    /** Create the anchors */
    this.translationRotationAnchor = new Object3D()
    this.translationRotationAnchor.name = 'TranslationAnchor'
    this.display.add(this.translationRotationAnchor)

    this.scaleAnchor = new Object3D()
    this.scaleAnchor.name = 'ScaleAnchor'
    this.display.add(this.scaleAnchor)

    this.raycaster = new Raycaster()
    this.raycaster.layers.set(ObjectLayers.PROPS)

    /** Create the controls. We create them only once, and attach/detach as needed */
    this.setupControls()

    /** Whenever we switch projections we update the controls with the new camera
     *  The speckle viewer uses different camera instances for it's different projections
     */
    this.cameraProvider.on(CameraEvent.ProjectionChanged, () => {
      //@ts-ignore
      this.translateControls.camera = this.viewer.getRenderer().renderingCamera
      //@ts-ignore
      this.rotateControls.camera = this.viewer.getRenderer().renderingCamera
      //@ts-ignore
      this.scaleControls.camera = this.viewer.getRenderer().renderingCamera
    })

    /** This might not be needed */
    // this.cameraProvider.on(CameraEvent.FrameUpdate, (data: boolean) => {
    //   this.allowSelection = !data
    // })
    /** Hook up to le click */
    this.viewer.getRenderer().input.on(InputEvent.Click, this.clickHandler.bind(this))

    /** Start off disabled */
    this.enabled = false
  }

  /**
   *
   */

  /** We use the viewer's frame update to enable/disable the translate and rotate controls
   *  The controls were not meant to be overlayed and working in multiple instance setups
   *  so their input events overlap. It's not the best solution in the world, but it's one
   *  that requires little to no source change
   */
  public onEarlyUpdate() {
    if (this.dragging) return

    /** Test the translate gizmos */
    const intersectTranslate = intersectObjectWithRay(
      //@ts-ignore
      this.translateControls._gizmo.picker['translate'],
      this.translateControls.getRaycaster()
    )

    /** Test the rotate gizmos */
    const intersectRotate = intersectObjectWithRay(
      //@ts-ignore
      this.rotateControls._gizmo.picker['rotate'],
      this.rotateControls.getRaycaster()
    )

    /** Get the distances if any */
    const translatDistance = intersectTranslate
      ? intersectTranslate.distance
      : Number.MAX_VALUE
    const rotateDistance = intersectRotate ? intersectRotate.distance : Number.MAX_VALUE

    /** Enable the closest, disable the other
     *  It's not stupid if it works
     */
    if (translatDistance <= rotateDistance) {
      this.translateControls._doNotPick = false
      this.rotateControls._doNotPick = true
    } else {
      this.translateControls._doNotPick = true
      this.rotateControls._doNotPick = false
    }
  }

  /** Explicit events for the selection tool */
  public on<T extends SectionToolEvent>(
    eventType: T,
    listener: (arg: SectionToolEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  /** Gets the OBB model */
  public getBox(): OBB {
    return this.obb
  }

  /**
   * Sets the OBB model and updates the tool gizmos and box
   * @param targetBox The box to set. It accepts an aabb as well
   * @param offset Optional offset
   */
  public setBox(
    targetBox: OBB | Box3 | { min: Vector3Like; max: Vector3Like },
    offset = 0
  ): void {
    /** If no offset is provided we add a tiny factor in order to avoid z-fighting */
    offset = offset === 0 ? 0.0001 : offset

    if (this.isOBB(targetBox)) {
      /** Use the offset as a relative value */
      const expandedBox = World.expandBoxRelative(targetBox, offset)
      /** Copy over to the OBB model */
      this.obb.center.copy(expandedBox.center)
      this.obb.halfSize.copy(expandedBox.halfSize)
      this.obb.rotation.copy(expandedBox.rotation)
    } else if (this.isAABB(targetBox)) {
      /** Use an AABB */
      let box = new Box3()
      box.min.copy(targetBox.min)
      box.max.copy(targetBox.max)
      /** Do not allow empty boxes */
      if (box.isEmpty()) box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      /** Use the offset as a relative value */
      box = World.expandBoxRelative(targetBox, offset)
      /** Copy over to the OBB model with no rotation */
      this.obb.center.copy(box.getCenter(new Vector3()))
      this.obb.halfSize.copy(box.getSize(new Vector3()).multiplyScalar(0.5))
      this.obb.rotation.identity()
    } else Logger.error(`Incorrect argument for setBox ${targetBox}`)

    /** Update the tool */
    this.updatePlanes()
    this.updateVisual()
    this.emit(SectionToolEvent.Updated, this.planes)
  }

  /**
   * Convenience method
   */
  public toggle(): void {
    this.enabled = !this._enabled
  }

  /** Gets the transformation defined by the OBB */
  public getObbTransform() {
    return new Matrix4().compose(
      this.obb.center,
      _quaternion.setFromRotationMatrix(_matrix4.setFromMatrix3(this.obb.rotation)),
      _vector3.copy(this.obb.halfSize).multiplyScalar(2)
    )
  }

  /**
   * Creates the controls and all their gizmos
   */
  protected setupControls() {
    /** Get the current camera */
    const camera = this.viewer.getRenderer().renderingCamera
    if (!camera) {
      throw new Error('Cannot create SectionTool extension. No rendering camera found')
    }

    /** Translate */
    this.translateControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    /** Layers are not recursive in three.js. We need to assign them to all objects */
    for (let k = 0; k < this.translateControls._root.children.length; k++) {
      this.translateControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.translateControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.translateControls.setSize(0.75)
    this.translateControls.space = 'local'
    this.display.add(this.translateControls._root)

    /** Rotate */
    this.rotateControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    /** Layers are not recursive in three.js. We need to assign them to all objects */
    for (let k = 0; k < this.rotateControls._root.children.length; k++) {
      this.rotateControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.rotateControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.rotateControls.setSize(0.5)
    this.rotateControls.mode = 'rotate'
    this.rotateControls.space = 'local'
    this.display.add(this.rotateControls._root)

    /** Scale */
    this.scaleControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    /** Layers are not recursive in three.js. We need to assign them to all objects */
    for (let k = 0; k < this.scaleControls._root.children.length; k++) {
      this.scaleControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.scaleControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.scaleControls.setSize(0.5)
    this.scaleControls.mode = 'scale'
    this.scaleControls._root.visible = false
    this.display.add(this.scaleControls._root)

    /** Hook into the controls' events.*/
    this.translateControls.addEventListener('change', this.changeHandler.bind(this))
    this.translateControls.addEventListener(
      'dragging-changed',
      this.draggingHandler.bind(this)
    )

    this.rotateControls.addEventListener('change', this.changeHandler.bind(this))
    this.rotateControls.addEventListener(
      'dragging-changed',
      this.draggingHandler.bind(this)
    )

    this.scaleControls.addEventListener('change', this.changeHandler.bind(this))
    this.scaleControls.addEventListener(
      'dragging-changed',
      this.draggingHandler.bind(this)
    )
  }

  /**
   * Controls, outline and hitbox update based on the OBB model
   */
  protected updateVisual() {
    /** Update the controls */
    this.translationRotationAnchor.position.copy(this.obb.center)
    this.translationRotationAnchor.quaternion.copy(
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      )
    )
    this.scaleAnchor.scale.copy(this.obb.halfSize)

    /** Update the hit box */
    this.boxHitMesh.position.copy(this.obb.center)
    this.boxHitMesh.scale.copy(this.obb.halfSize)
    this.boxHitMesh.scale.multiplyScalar(2)
    this.boxHitMesh.quaternion.copy(
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      )
    )
    /** Update the visible outline box */
    this.updateOutline()
  }

  /**
   * Triggers when dragging starts/stops
   * @param event Controls event
   */
  //@ts-ignore
  protected draggingHandler(event) {
    this.dragging = event.value
    if (this.dragging) {
      this.cameraProvider.enabled = false
      if (event.target === this.translateControls) this.rotateControls.detach()
      else if (event.target === this.rotateControls) this.translateControls.detach()
      this.emit(SectionToolEvent.DragStart)
    } else {
      this.cameraProvider.enabled = true
      if (event.target === this.translateControls)
        this.rotateControls.attach(this.translationRotationAnchor)
      else if (event.target === this.rotateControls)
        this.translateControls.attach(this.translationRotationAnchor)
      this.emit(SectionToolEvent.DragEnd)
    }
    this.viewer.requestRender()
  }

  /** Triggers whenever there is a change in the controls and their gizmos
   *  This is where the model OBB gets updated according to controls changes.
   *  Each control type writes it's data in the anchor's matching property. So:
   *  - Translate control write to it's anchor 'position'
   *  - Rotate control writes to it's anchor 'quaternion'
   *  - Scale control writes to it's anchor 'scale
   */
  //@ts-ignore
  protected changeHandler() {
    /** Just copy over position, rotation  and scale*/
    this.obb.center.copy(this.translationRotationAnchor.position)
    this.obb.rotation.copy(
      new Matrix3().setFromMatrix4(
        new Matrix4().makeRotationFromQuaternion(
          this.translationRotationAnchor.quaternion
        )
      )
    )
    this.obb.halfSize.copy(this.scaleAnchor.scale)

    /** If there is a change in scale we need to adjust translation since we can only
     *  push/pull a single face at a time. Simply applying a scale will bilaterally
     *  increase the size of the box
     */
    if (!this.lastScale) this.lastScale = new Vector3().copy(this.scaleAnchor.scale)
    /** Get a scale delta */
    this.lastScale.sub(this.scaleAnchor.scale)
    this.lastScale.negate()

    if (this.draggingFace) {
      /** Get the face normal and apply the current rotation */
      const dir = new Vector3()
        .copy(this.draggingFace.normal)
        .applyQuaternion(
          new Quaternion().setFromRotationMatrix(
            new Matrix4().setFromMatrix3(this.obb.rotation)
          )
        )
        .normalize()
      /** Compute the amount we need to adjust the box center */
      const scalar =
        Math.abs(this.draggingFace.normal.x) * this.lastScale.x +
        Math.abs(this.draggingFace.normal.y) * this.lastScale.y +
        Math.abs(this.draggingFace.normal.z) * this.lastScale.z

      dir.multiplyScalar(scalar)
      /** Apply the adjustment */
      this.obb.center.sub(dir)
    }

    this.lastScale.copy(this.scaleAnchor.scale)

    /** Update everything */
    this.updatePlanes()
    this.updateVisual()
    this.updateFaceControls(this.draggingFace)
    this.viewer.requestRender()
  }

  /**
   * Handler used for detecting when we click on the box faces
   * @param args NDC pointer coords + original event + multiselect
   * @returns
   */
  protected clickHandler(
    args: Vector2 & { event: PointerEvent; multiSelect: boolean }
  ) {
    if (this.dragging) return
    if (!this.enabled || !this.visible) return

    /** We only test against our hit box mesh */
    this.raycaster.setFromCamera(args, this.cameraProvider.renderingCamera)
    let intersectedObjects: Array<Intersection> = []

    intersectedObjects = this.raycaster.intersectObject(this.boxHitMesh)

    /** If we did not hit it, reset it to default */
    if (!intersectedObjects.length) {
      this.translateControls.attach(this.translationRotationAnchor)
      this.rotateControls.attach(this.translationRotationAnchor)
      this.scaleControls.detach()
      this.facePlane.visible = false
      this.draggingFace = null
      return
    }

    /** If we have a hit hide translate and rotate and show scale controls */
    this.draggingFace = intersectedObjects[0].face as Face
    this.translateControls.detach()
    this.rotateControls.detach()
    this.scaleControls.attach(this.scaleAnchor)
    this.updateFaceControls(this.draggingFace)
  }

  /**
   * Computes the final box planes from the unit cube planes
   * transformed against the current OBB model
   */
  protected updatePlanes() {
    /** Build the matrix */
    const obbMatrix = this.getObbTransform()

    /** Determine if there is a change */
    let obbChanged = false
    for (let i = 0; i < 16; i++) {
      if (Math.abs(obbMatrix.elements[i] - this.lastObbTransform.elements[i]) > 1e-6) {
        obbChanged = true
        break
      }
    }

    /** If there is no change return */
    if (!obbChanged) return

    /** Compute final planes */
    for (let k = 0; k < this.localPlanes.length; k++) {
      this.planes[k].copy(this.localPlanes[k])
      this.planes[k].applyMatrix4(obbMatrix)
    }
    /** Set the viewer's clipping planes and notify*/
    this.viewer.getRenderer().clippingPlanes = this.planes
    this.viewer.getRenderer().clippingVolume = this.getBox()
    this.emit(SectionToolEvent.Updated, this.planes)
    this.lastObbTransform.copy(obbMatrix)
  }

  /**
   * Creates the plane mesh that will be shown when selecting a box face
   * It's RTE enabled
   */
  protected createFacePlane() {
    /** Unit plane */
    const facePlaneGeometry = new PlaneGeometry(1, 1)
    /** RTE attributes */
    Geometry.updateRTEGeometry(facePlaneGeometry, new Float32Array(12))
    ;(facePlaneGeometry.attributes.position as BufferAttribute).setUsage(
      DynamicDrawUsage
    )
    ;(facePlaneGeometry.attributes['position_low'] as BufferAttribute).setUsage(
      DynamicDrawUsage
    )
    /** Make a regular mesh  */
    const facePlane = new Mesh(
      facePlaneGeometry,
      new SpeckleStandardMaterial(
        {
          transparent: true,
          side: DoubleSide,
          opacity: 0.1,
          wireframe: false,
          color: 0x0a66ff,
          metalness: 0.1,
          roughness: 0.75
        },
        ['USE_RTE']
      )
    )
    facePlane.layers.set(ObjectLayers.PROPS)
    facePlane.renderOrder = 5 // This is probably not needed
    facePlane.frustumCulled = false

    return facePlane
  }

  /**
   * Updates the scale control and plane mesh when a cube face is selected
   * @param face The face we're pulling/pushing
   * @returns void
   */
  protected updateFaceControls(face: Face | null) {
    if (!face) return
    const vertices = this.boxHitMesh.geometry.attributes.position
    /** Get the face from the LUT */
    //@ts-ignore
    const cubeFace = this.cubeFaces[`${face.a}${face.b}${face.c}`]
    /** Diagonal endponints */
    const v0 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[0])
    const v3 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[3])

    /** Middle point of the diagonal */
    const faceCenter = new Vector3(
      (v0.x + v3.x) / 2,
      (v0.y + v3.y) / 2,
      (v0.z + v3.z) / 2
    )

    /** Compute OBB matrix */
    const obbMatrix = this.getObbTransform()

    /** Apply it to the unit diagonal middle point and face normal */
    faceCenter.applyMatrix4(obbMatrix)
    const faceQuat = new Quaternion().setFromUnitVectors(
      new Vector3().copy(cubeFace.normal).negate(),
      face.normal
    )
    faceQuat.premultiply(
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      )
    )

    /** Set the scale control's anchor position and orientation */
    this.scaleAnchor.position.copy(faceCenter)
    this.scaleAnchor.quaternion.copy(faceQuat)
    // this.scaleAnchor.scale.copy(this.obb.halfSize)
    /** We only show one axis based on the face normal we're pulling/pushing */
    //@ts-ignore
    this.scaleControls.showX = cubeFace.axis === 'x'
    //@ts-ignore
    this.scaleControls.showY = cubeFace.axis === 'y'
    //@ts-ignore
    this.scaleControls.showZ = cubeFace.axis === 'z'

    /** Update the face plane highlight */
    this.facePlane.visible = true
    /** Copy the other two vrtices, first two are at the top */
    const v1 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[1])
    const v2 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[2])

    /** Transform them */
    v0.applyMatrix4(obbMatrix)
    v1.applyMatrix4(obbMatrix)
    v2.applyMatrix4(obbMatrix)
    v3.applyMatrix4(obbMatrix)

    /** Copy them to a scratch array. We can afford to do this, it's only 4 verts */
    v0.toArray(scratchPlaneArray, 0)
    v1.toArray(scratchPlaneArray, 3)
    v2.toArray(scratchPlaneArray, 6)
    v3.toArray(scratchPlaneArray, 9)

    const posAttr = this.facePlane.geometry.attributes['position'] as BufferAttribute
    // prettier-ignore
    const posAttrLow = this.facePlane.geometry.attributes['position_low'] as BufferAttribute

    /** Split the positions straight in the high/low attributes */
    Geometry.DoubleToHighLowBuffer(
      scratchPlaneArray,
      posAttrLow.array as Float32Array,
      posAttr.array as Float32Array
    )
    posAttr.needsUpdate = true
    posAttrLow.needsUpdate = true
  }

  /** Creates the geometry for the visible outline of the section tool */
  protected createOutline() {
    /** We start from the unit cube's edges */
    const buffer = unitCubeEdges.slice() as unknown as Float32Array

    /** Create the line segments geometry */
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(buffer)
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    /** RTE it */
    Geometry.updateRTEGeometry(lineGeometry, buffer)
    /** Line material */
    const material = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 1,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(32, 32)
      },
      ['USE_RTE']
    )
    material.color = new Color(0x047efb)
    material.color.convertSRGBToLinear()
    material.linewidth = 1
    material.worldUnits = false
    material.resolution = new Vector2(32, 32)
    material.toneMapped = false

    /** Create the displayable object */
    const clipOutline = new LineSegments2(lineGeometry, material)
    clipOutline.name = `oriented-box-outline`
    clipOutline.frustumCulled = false
    clipOutline.renderOrder = 1
    clipOutline.layers.set(ObjectLayers.PROPS)

    return clipOutline
  }

  /** Updates the section tool outline by updating it's vertices
   *  We chose to do it this way in order have RTE working
   */
  protected updateOutline() {
    /** Compute the OBB matrix */
    const obbMatrix = this.getObbTransform()

    /** Transform the unit cube edges with the OBB matrix */
    const vec = new Vector3()
    for (let k = 0; k < unitCubeEdges.length; k += 3) {
      vec.fromArray(unitCubeEdges, k)
      vec.applyMatrix4(obbMatrix)
      scratchArray[k] = vec.x
      scratchArray[k + 1] = vec.y
      scratchArray[k + 2] = vec.z
    }

    /** Split the result into the high/low attribute buffers */
    const posAttr = (
      this.boxOutline.geometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data
    const posAttrLow = (
      this.boxOutline.geometry.attributes[
        'instanceStartLow'
      ] as InterleavedBufferAttribute
    ).data
    Geometry.DoubleToHighLowBuffer(
      scratchArray,
      posAttrLow.array as Float32Array,
      posAttr.array as Float32Array
    )
    this.boxOutline.geometry.attributes['instanceStart'].needsUpdate = true
    this.boxOutline.geometry.attributes['instanceEnd'].needsUpdate = true
    this.boxOutline.geometry.attributes['instanceStartLow'].needsUpdate = true
    this.boxOutline.geometry.attributes['instanceEndLow'].needsUpdate = true
  }

  /** Creates a unit cube geometry instance*/
  protected createCubeGeometry() {
    const vertices = unitCube.slice()
    const indexes = unitCubeIndices.slice()

    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    g.setIndex(new Uint16BufferAttribute(indexes, 1))
    g.computeBoundingBox()
    g.computeVertexNormals()
    return g
  }

  /** Restes the gizmos. Honestly not sure if it does anything meaningfull */
  protected reset() {
    this.translateControls.reset()
    this.translateControls.reset()
    this.scaleControls.reset()
  }

  /** Type guards */
  protected isAABB(
    box: Box3 | { min: Vector3Like; max: Vector3Like } | OBB
  ): box is Box3 {
    return box instanceof Box3 || ('min' in box && 'max' in box)
  }

  protected isOBB(
    box: Box3 | { min: Vector3Like; max: Vector3Like } | OBB
  ): box is OBB {
    return box instanceof OBB
  }
}
