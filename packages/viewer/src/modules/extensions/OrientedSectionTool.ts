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

export class OrientedSectionTool extends Extension {
  public get inject() {
    return [CameraController]
  }

  protected dragging = false
  protected display: Group
  protected obb: OBB = new OBB()
  protected boxMaterial: MeshStandardMaterial
  protected boxMesh: Mesh
  protected boxTransform: Matrix4
  protected translationAnchor: Object3D
  protected rotationAnchor: Object3D
  protected scaleAnchor: Object3D

  protected planes: Plane[]

  protected prevPosition: Vector3 | null
  protected prevQuaternion: Quaternion | null

  protected translateControls: TransformControls
  protected rotateControls: TransformControls
  protected scaleControls: TransformControls

  protected raycaster: Raycaster

  protected cubeFaces = {
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
    // this.viewer.getRenderer().renderer.localClippingEnabled = value
    // this.emit(SectionToolEvent.Updated, this.planes)
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

    this.translationAnchor = new Object3D()
    this.translationAnchor.name = 'TranslationAnchor'
    this.display.add(this.translationAnchor)

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
    this.translateControls.attach(this.translationAnchor)
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
    this.rotateControls.attach(this.translationAnchor)
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
    this.scaleControls.attach(this.scaleAnchor)
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
    this.translationAnchor.position.copy(this.obb.center)
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
    } else {
      this.cameraProvider.enabled = true
      if (event.target === this.translateControls)
        this.rotateControls.attach(this.translationAnchor)
      else if (event.target === this.rotateControls)
        this.translateControls.attach(this.translationAnchor)
    }
    this.viewer.requestRender()
  }

  //@ts-ignore
  protected changeHandler() {
    this.obb.center.copy(this.translationAnchor.position)
    this.obb.rotation.copy(
      new Matrix3().setFromMatrix4(
        new Matrix4().makeRotationFromQuaternion(this.translationAnchor.quaternion)
      )
    )
    this.updateVisual()
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
      this.translateControls.attach(this.translationAnchor)
      this.rotateControls.attach(this.translationAnchor)
      this.scaleControls.detach()
      return
    }

    this.translateControls.detach()
    this.rotateControls.detach()
    this.scaleControls.attach(this.scaleAnchor)
    this.updateScaleControls(intersectedObjects[0].face as Face)
    // if (intersectedObjects.length === 0 && !this.dragging) {
    //   this._attachControlsToBox()
    //   ;(this.boxMeshHelper.material as Material).opacity = 0.5
    //   this.attachedToBox = true
    //   return
    // }
    // this.attachedToBox = false
    // ;(this.boxMeshHelper.material as Material).opacity = 0.3
    // this.hoverPlane.visible = true
    // const side =
    //   this.sidesSimple[
    //     `${intersectedObjects[0].face?.a}${intersectedObjects[0].face?.b}${intersectedObjects[0].face?.c}`
    //   ]
    // /** Catering to typescript
    //  *  We're intersection an indexed mesh. There will always be an intersected face
    //  */
    // if (!side) {
    //   throw new Error('Cannot determine section side')
    // }
    // this.controls.showX = side.axis === 'x'
    // this.controls.showY = side.axis === 'y'
    // this.controls.showZ = side.axis === 'z'

    // this.currentRange = side.verts

    // const boxArr = this.boxGeometry.attributes.position
    // let index = 0
    // const planeArr = this.plane.attributes.position.array as number[]
    // const centre = new Vector3()

    // const tempArr = []
    // for (let i = 0; i < planeArr.length; i++) {
    //   if (i % 3 === 0) {
    //     tempArr.push(boxArr.getX(this.currentRange[index]))
    //   } else if (i % 3 === 1) {
    //     tempArr.push(boxArr.getY(this.currentRange[index]))
    //   } else if (i % 3 === 2) {
    //     tempArr.push(boxArr.getZ(this.currentRange[index]))
    //     centre.add(new Vector3(tempArr[i - 2], tempArr[i - 1], tempArr[i]))
    //     index++
    //   }
    // }

    // centre.multiplyScalar(0.25)
    // this.hoverPlane.position.copy(centre.applyMatrix4(this.boxMesh.matrixWorld))
    // this.prevPosition = this.hoverPlane.position.clone()
    // index = 0
    // for (let i = 0; i < planeArr.length; i++) {
    //   if (i % 3 === 0) {
    //     planeArr[i] = boxArr.getX(this.currentRange[index]) - centre.x
    //   } else if (i % 3 === 1) {
    //     planeArr[i] = boxArr.getY(this.currentRange[index]) - centre.y
    //   } else if (i % 3 === 2) {
    //     planeArr[i] = boxArr.getZ(this.currentRange[index]) - centre.z
    //     index++
    //   }
    // }

    // this.plane.applyMatrix4(this.boxMesh.matrixWorld)
    // this.plane.attributes.position.needsUpdate = true
    // this.plane.computeBoundingSphere()
    // this.plane.computeBoundingBox()
    // this.controls?.detach()
    // this.controls?.attach(this.hoverPlane)
    // this.controls?.updateMatrixWorld()
  }

  private updateScaleControls(face: Face) {
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
    this.scaleControls.showX = cubeFace.axis === 'x'
    this.scaleControls.showY = cubeFace.axis === 'y'
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

  public getBox(): OBB | null {
    // if (!this.display.visible) return new Box3()
    // return this.boxGeometry.boundingBox || new Box3()
    return null
  }

  public setBox(targetBox: OBB | Box3, offset = 0): void {
    offset
    if (targetBox instanceof OBB) {
      console.warn('plm')
    } else {
      this.obb.center.copy(targetBox.getCenter(new Vector3()))
      this.obb.halfSize.copy(targetBox.getSize(new Vector3()).multiplyScalar(0.5))
      this.updateVisual()
    }
    // let box
    // if (targetBox) box = targetBox
    // else {
    //   box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    // }
    // if (box.min.x === Infinity) {
    //   box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    // }
    // let x1, y1, z1, x2, y2, z2
    // if (offset === 0) {
    //   const offsetBox = this.viewer.World.getRelativeOffsetBox(box, 0.0001)
    //   x1 = offsetBox.min.x //box.min.x - (box.max.x - box.min.x) * offset
    //   y1 = offsetBox.min.y //box.min.y - (box.max.y - box.min.y) * offset
    //   z1 = offsetBox.min.z //box.min.z - (box.max.z - box.min.z) * offset
    //   x2 = offsetBox.max.x //box.max.x + (box.max.x - box.min.x) * offset
    //   y2 = offsetBox.max.y //box.max.y + (box.max.y - box.min.y) * offset
    //   z2 = offsetBox.max.z //box.max.z + (box.max.z - box.min.z) * offset
    // } else {
    //   x1 = box.min.x - (box.max.x - box.min.x) * offset
    //   y1 = box.min.y - (box.max.y - box.min.y) * offset
    //   z1 = box.min.z - (box.max.z - box.min.z) * offset
    //   x2 = box.max.x + (box.max.x - box.min.x) * offset
    //   y2 = box.max.y + (box.max.y - box.min.y) * offset
    //   z2 = box.max.z + (box.max.z - box.min.z) * offset
    // }
    // const newVertices = [
    //   x1,
    //   y1,
    //   z1,
    //   x2,
    //   y1,
    //   z1,
    //   x2,
    //   y2,
    //   z1,
    //   x1,
    //   y2,
    //   z1,
    //   x1,
    //   y1,
    //   z2,
    //   x2,
    //   y1,
    //   z2,
    //   x2,
    //   y2,
    //   z2,
    //   x1,
    //   y2,
    //   z2
    // ]
    // const boxVerts = this.boxGeometry.attributes.position.array as number[]
    // for (let i = 0; i < newVertices.length; i++) {
    //   boxVerts[i] = newVertices[i]
    // }
    // this.boxGeometry.attributes.position.needsUpdate = true
    // this.boxGeometry.computeVertexNormals()
    // this.boxGeometry.computeBoundingBox()
    // this.boxGeometry.computeBoundingSphere()
    // this._generateOrUpdatePlanes()
    // this._attachControlsToBox()
    // this.boxMeshHelper.position.copy(
    //   //@ts-ignore
    //   this.boxMesh.position
    // )
    // this.emit(SectionToolEvent.Updated, this.planes)
    // this.viewer.getRenderer().clippingPlanes = this.planes
    // this.viewer.getRenderer().clippingVolume = this.getBox()
    // this.viewer.requestRender()
  }

  public toggle(): void {
    this.enabled = !this._enabled
  }
}
