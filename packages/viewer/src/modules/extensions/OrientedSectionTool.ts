/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Group,
  Box3,
  BufferGeometry,
  MeshStandardMaterial,
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
  Face
} from 'three'
import { TransformControls } from './TransformControls.js'
import { OBB } from 'three/examples/jsm/math/OBB.js'
import { type IViewer, ObjectLayers } from '../../IViewer.js'
import { Extension } from './Extension.js'
import { CameraController } from './CameraController.js'
import { SectionToolEvent, SectionToolEventPayload } from './SectionTool.js'
import { InputEvent } from '../input/Input.js'
import { Vector3Like } from '../batching/BatchObject.js'
import Logger from '../utils/Logger.js'
import { World } from '../World.js'

export class OrientedSectionTool extends Extension {
  public get inject() {
    return [CameraController]
  }

  protected obb: OBB = new OBB()
  protected planes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), 0.5),
    new Plane(new Vector3(-1, 0, 0), 0.5),
    new Plane(new Vector3(0, 1, 0), 0.5),
    new Plane(new Vector3(0, -1, 0), 0.5),
    new Plane(new Vector3(0, 0, 1), 0.5),
    new Plane(new Vector3(0, 0, -1), 0.5)
  ]
  protected localPlanes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), 0.5),
    new Plane(new Vector3(-1, 0, 0), 0.5),
    new Plane(new Vector3(0, 1, 0), 0.5),
    new Plane(new Vector3(0, -1, 0), 0.5),
    new Plane(new Vector3(0, 0, 1), 0.5),
    new Plane(new Vector3(0, 0, -1), 0.5)
  ]

  protected dragging = false
  protected display: Group
  protected boxMaterial: MeshStandardMaterial
  protected boxMesh: Mesh

  protected translationRotationAnchor: Object3D
  protected scaleAnchor: Object3D

  protected lastScale: Vector3 | null
  protected draggingFace: Face | null

  protected translateControls: TransformControls
  protected rotateControls: TransformControls
  protected scaleControls: TransformControls

  protected raycaster: Raycaster

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
    }
    this.viewer.getRenderer().renderer.localClippingEnabled = value
    this.emit(SectionToolEvent.Updated, this.planes)
    this.viewer.requestRender()
  }

  public get visible(): boolean {
    return this.display.visible
  }

  public set visible(value: boolean) {
    this.display.visible = value
  }

  constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer)
    this.viewer = viewer

    this.viewer.getRenderer().renderer.localClippingEnabled = true

    this.dragging = false
    this.display = new Group()
    this.display.name = 'SectionBox'
    this.display.layers.set(ObjectLayers.PROPS)
    this.viewer.getRenderer().scene.add(this.display)

    // box
    const boxGeometry = this.createCubeGeometry()
    this.boxMaterial = new MeshStandardMaterial({
      color: 0x00ffff,
      opacity: 0,
      wireframe: true,
      side: DoubleSide
    })
    this.boxMesh = new Mesh(boxGeometry, this.boxMaterial)
    this.boxMesh.layers.set(ObjectLayers.PROPS)

    this.display.add(this.boxMesh)

    this.translationRotationAnchor = new Object3D()
    this.translationRotationAnchor.name = 'TranslationAnchor'
    this.display.add(this.translationRotationAnchor)

    this.scaleAnchor = new Object3D()
    this.scaleAnchor.name = 'ScaleAnchor'
    this.display.add(this.scaleAnchor)

    this.raycaster = new Raycaster()
    this.raycaster.layers.set(ObjectLayers.PROPS)

    this.setupControls()

    // this.cameraProvider.on(CameraEvent.ProjectionChanged, () => {
    //   this._setupControls()
    //   this._attachControlsToBox()
    // })
    // this.cameraProvider.on(CameraEvent.FrameUpdate, (data: boolean) => {
    //   this.allowSelection = !data
    // })
    this.viewer.getRenderer().input.on(InputEvent.Click, this.clickHandler.bind(this))
    this.enabled = false
  }

  public on<T extends SectionToolEvent>(
    eventType: T,
    listener: (arg: SectionToolEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  private setupControls() {
    const camera = this.viewer.getRenderer().renderingCamera
    if (!camera) {
      throw new Error('Cannot create SectionTool extension. No rendering camera found')
    }

    this.translateControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    for (let k = 0; k < this.translateControls._root.children.length; k++) {
      this.translateControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.translateControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.translateControls.setSize(0.75)
    this.display.add(this.translateControls._root)

    this.rotateControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    for (let k = 0; k < this.rotateControls._root.children.length; k++) {
      this.rotateControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.rotateControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.rotateControls.setSize(0.5)
    this.rotateControls.mode = 'rotate'
    this.rotateControls.axis = 'XYZ'
    this.display.add(this.rotateControls._root)

    this.scaleControls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    for (let k = 0; k < this.scaleControls._root.children.length; k++) {
      this.scaleControls._root.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.scaleControls.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.scaleControls.setSize(0.5)
    this.scaleControls.mode = 'scale'
    this.scaleControls.axis = 'X'
    this.scaleControls._root.visible = false
    this.display.add(this.scaleControls._root)

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

  protected updateVisual() {
    this.translationRotationAnchor.position.copy(this.obb.center)
    this.scaleAnchor.scale.copy(this.obb.halfSize)
    this.boxMesh.position.copy(this.obb.center)
    this.boxMesh.scale.copy(this.obb.halfSize)
    this.boxMesh.scale.multiplyScalar(2)
    this.boxMesh.quaternion.copy(
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      )
    )
  }

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

  //@ts-ignore
  protected changeHandler() {
    this.obb.center.copy(this.translationRotationAnchor.position)
    this.obb.rotation.copy(
      new Matrix3().setFromMatrix4(
        new Matrix4().makeRotationFromQuaternion(
          this.translationRotationAnchor.quaternion
        )
      )
    )

    if (!this.lastScale) this.lastScale = new Vector3().copy(this.scaleAnchor.scale)
    this.lastScale.sub(this.scaleAnchor.scale)
    this.lastScale.negate()

    this.obb.halfSize.copy(this.scaleAnchor.scale)
    if (this.draggingFace) {
      const dir = new Vector3()
        .copy(this.draggingFace.normal)
        .applyQuaternion(
          new Quaternion().setFromRotationMatrix(
            new Matrix4().setFromMatrix3(this.obb.rotation)
          )
        )
        .normalize()
      const scalar =
        Math.abs(this.draggingFace.normal.x) * this.lastScale.x +
        Math.abs(this.draggingFace.normal.y) * this.lastScale.y +
        Math.abs(this.draggingFace.normal.z) * this.lastScale.z

      dir.multiplyScalar(scalar)
      this.obb.center.sub(dir)
    }

    this.lastScale.copy(this.scaleAnchor.scale)
    this.updatePlanes()
    this.updateVisual()
    this.updateFaceControls(this.draggingFace as Face)
    this.emit(SectionToolEvent.Updated, this.planes)
    this.viewer.requestRender()
  }

  protected clickHandler(
    args: Vector2 & { event: PointerEvent; multiSelect: boolean }
  ) {
    // if (!this.allowSelection || this.dragging) return

    this.raycaster.setFromCamera(args, this.cameraProvider.renderingCamera)
    let intersectedObjects: Array<Intersection> = []
    if (this.display.visible) {
      intersectedObjects = this.raycaster.intersectObject(this.boxMesh)
    }
    if (!intersectedObjects.length) {
      this.translateControls.attach(this.translationRotationAnchor)
      this.rotateControls.attach(this.translationRotationAnchor)
      this.scaleControls.detach()
      this.draggingFace = null
      return
    }

    this.draggingFace = intersectedObjects[0].face as Face
    this.translateControls.detach()
    this.rotateControls.detach()
    this.scaleControls.attach(this.scaleAnchor)
    this.updateFaceControls(this.draggingFace)
  }

  protected updatePlanes() {
    const obbMatrix = new Matrix4().compose(
      this.obb.center,
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      ),
      new Vector3().copy(this.obb.halfSize).multiplyScalar(2)
    )

    for (let k = 0; k < this.localPlanes.length; k++) {
      this.planes[k].copy(this.localPlanes[k])
      this.planes[k].applyMatrix4(obbMatrix)
    }
    this.viewer.getRenderer().clippingPlanes = this.planes
    this.viewer.getRenderer().clippingVolume = this.getBox()
  }

  protected updateFaceControls(face: Face) {
    if (!face) return
    const vertices = this.boxMesh.geometry.attributes.position
    //@ts-ignore
    const cubeFace = this.cubeFaces[`${face.a}${face.b}${face.c}`]
    const v0 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[0])
    const v3 = new Vector3().fromBufferAttribute(vertices, cubeFace.verts[3])

    const faceCenter = new Vector3(
      (v0.x + v3.x) / 2,
      (v0.y + v3.y) / 2,
      (v0.z + v3.z) / 2
    )
    const obbMatrix = new Matrix4().compose(
      this.obb.center,
      new Quaternion().setFromRotationMatrix(
        new Matrix4().setFromMatrix3(this.obb.rotation)
      ),
      new Vector3().copy(this.obb.halfSize).multiplyScalar(2)
    )
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

    this.scaleAnchor.position.copy(faceCenter)
    this.scaleAnchor.quaternion.copy(faceQuat)
    this.scaleAnchor.scale.copy(this.obb.halfSize)
    //@ts-ignore
    this.scaleControls.showX = cubeFace.axis === 'x'
    //@ts-ignore
    this.scaleControls.showY = cubeFace.axis === 'y'
    //@ts-ignore
    this.scaleControls.showZ = cubeFace.axis === 'z'
  }

  private createCubeGeometry(width = 0.5, depth = 0.5, height = 0.5) {
    // GJ Prettier
    const vertices = [
      -1 * width,
      -1 * depth,
      -1 * height,
      1 * width,
      -1 * depth,
      -1 * height,
      1 * width,
      1 * depth,
      -1 * height,
      -1 * width,
      1 * depth,
      -1 * height,
      -1 * width,
      -1 * depth,
      1 * height,
      1 * width,
      -1 * depth,
      1 * height,
      1 * width,
      1 * depth,
      1 * height,
      -1 * width,
      1 * depth,
      1 * height
    ]

    const indexes = [
      0, 1, 3, 3, 1, 2, 1, 5, 2, 2, 5, 6, 5, 4, 6, 6, 4, 7, 4, 0, 7, 7, 0, 3, 3, 2, 7,
      7, 2, 6, 4, 5, 0, 0, 5, 1
    ]

    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    g.setIndex(indexes)
    g.computeBoundingBox()
    g.computeVertexNormals()
    return g
  }

  public getBox(): OBB {
    return this.obb
  }

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

  public setBox(
    targetBox: OBB | Box3 | { min: Vector3Like; max: Vector3Like },
    offset = 0
  ): void {
    offset = offset === 0 ? 0.0001 : offset
    if (this.isOBB(targetBox)) {
      const expandedBox = World.expandBoxRelative(targetBox, offset)
      this.obb.center.copy(expandedBox.center)
      this.obb.halfSize.copy(expandedBox.halfSize)
      this.obb.rotation.copy(expandedBox.rotation)
    } else if (this.isAABB(targetBox)) {
      let box = new Box3()
      box.min.copy(targetBox.min)
      box.max.copy(targetBox.max)
      if (box.isEmpty()) box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      box = World.expandBoxRelative(targetBox, offset)
      this.obb.center.copy(box.getCenter(new Vector3()))
      this.obb.halfSize.copy(box.getSize(new Vector3()).multiplyScalar(0.5))
    } else Logger.error(`Incorrect argument for setBox ${targetBox}`)

    this.updatePlanes()
    this.updateVisual()
    this.emit(SectionToolEvent.Updated, this.planes)
  }

  public toggle(): void {
    this.enabled = !this._enabled
  }
}
