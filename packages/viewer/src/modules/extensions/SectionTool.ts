import {
  Group,
  Box3,
  BufferGeometry,
  MeshStandardMaterial,
  Mesh,
  Box3Helper,
  LineBasicMaterial,
  PlaneGeometry,
  Vector3,
  Plane,
  Material,
  BufferAttribute,
  Raycaster,
  DoubleSide,
  SphereGeometry,
  type Intersection,
  Vector2
} from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { type IViewer, ObjectLayers } from '../../IViewer.js'
import { Extension } from './Extension.js'
import { CameraEvent } from '../objects/SpeckleCamera.js'
import { InputEvent } from '../input/Input.js'
import { CameraController } from './CameraController.js'

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

export class SectionTool extends Extension {
  public get inject() {
    return [CameraController]
  }

  protected dragging = false
  protected display: Group
  protected boxGeometry: BufferGeometry
  protected boxMaterial: MeshStandardMaterial
  protected boxMesh: Mesh
  protected boxMeshHelper: Box3Helper
  protected boxMeshHelperMaterial!: LineBasicMaterial
  protected plane: PlaneGeometry
  protected hoverPlane: Mesh
  protected sphere: Mesh

  protected sidesSimple: { [id: string]: { verts: number[]; axis: string } }
  protected currentRange: number[] | null
  protected planes!: Plane[]

  protected prevPosition: Vector3 | null
  protected attachedToBox: boolean

  protected controls!: TransformControls
  protected allowSelection!: boolean

  protected raycaster: Raycaster

  public get enabled() {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
    this.display.visible = value
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
    this.boxGeometry = this._generateSimpleCube(5, 5, 5)
    this.boxMaterial = new MeshStandardMaterial({
      color: 0x00ffff,
      opacity: 0,
      wireframe: false,
      side: DoubleSide
    })
    this.boxMesh = new Mesh(this.boxGeometry, this.boxMaterial)
    this.boxMesh.visible = false
    this.boxMesh.layers.set(ObjectLayers.PROPS)

    this.display.add(this.boxMesh)

    this.boxMeshHelper = new Box3Helper(this.boxGeometry.boundingBox || new Box3())
    this.boxMeshHelper.material = new LineBasicMaterial({
      color: 0x0a66ff,
      opacity: 0.4
    })

    this.boxMeshHelper.layers.set(ObjectLayers.PROPS)
    this.display.add(this.boxMeshHelper)

    // we're attaching the gizmo mover to this sphere in the box centre
    const sphere = new SphereGeometry(0.01, 10, 10)
    this.sphere = new Mesh(sphere, new MeshStandardMaterial({ color: 0x00ffff }))
    this.sphere.layers.set(ObjectLayers.PROPS)
    this.sphere.visible = false
    this.display.add(this.sphere)

    // plane
    this.plane = new PlaneGeometry(1, 1)
    this.hoverPlane = new Mesh(
      this.plane,
      new MeshStandardMaterial({
        transparent: true,
        side: DoubleSide,
        opacity: 0.1,
        wireframe: false,
        color: 0x0a66ff,
        metalness: 0.1,
        roughness: 0.75
      })
    )
    this.hoverPlane.visible = false
    this.hoverPlane.layers.set(ObjectLayers.PROPS)
    this.display.add(this.hoverPlane)

    this.raycaster = new Raycaster()
    this.raycaster.layers.set(ObjectLayers.PROPS)

    this.sidesSimple = {
      '256': { verts: [1, 2, 5, 6], axis: 'x' },
      '152': { verts: [1, 2, 5, 6], axis: 'x' },
      '407': { verts: [0, 3, 4, 7], axis: 'x' },
      '703': { verts: [0, 3, 4, 7], axis: 'x' },
      '327': { verts: [2, 3, 6, 7], axis: 'y' },
      '726': { verts: [2, 3, 6, 7], axis: 'y' },
      '450': { verts: [0, 1, 4, 5], axis: 'y' },
      '051': { verts: [0, 1, 4, 5], axis: 'y' },
      '312': { verts: [0, 1, 3, 2], axis: 'z' },
      '013': { verts: [0, 1, 3, 2], axis: 'z' },
      '546': { verts: [4, 5, 7, 6], axis: 'z' },
      '647': { verts: [4, 5, 7, 6], axis: 'z' }
    }

    this._generateOrUpdatePlanes()

    this.currentRange = null
    this.prevPosition = null
    this.attachedToBox = true

    this._setupControls()
    this._attachControlsToBox()

    this.cameraProvider.on(CameraEvent.ProjectionChanged, () => {
      this._setupControls()
      this._attachControlsToBox()
    })
    this.cameraProvider.on(CameraEvent.FrameUpdate, (data: boolean) => {
      this.allowSelection = !data
    })
    this.viewer.getRenderer().input.on(InputEvent.Click, this.clickHandler.bind(this))
    this.enabled = false
  }

  public on<T extends SectionToolEvent>(
    eventType: T,
    listener: (arg: SectionToolEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  private _setupControls() {
    const camera = this.viewer.getRenderer().renderingCamera
    if (!camera) {
      throw new Error('Cannot create SectionTool extension. No rendering camera found')
    }

    this.controls?.dispose()
    this.controls?.detach()
    this.controls = new TransformControls(
      camera,
      this.viewer.getRenderer().renderer.domElement
    )
    for (let k = 0; k < this.controls?.children.length; k++) {
      this.controls?.children[k].traverse((obj) => {
        obj.layers.set(ObjectLayers.PROPS)
      })
    }
    this.controls?.getRaycaster().layers.set(ObjectLayers.PROPS)
    this.controls?.setSize(0.75)
    this.display.add(this.controls)
    this.controls?.addEventListener('change', this._draggingChangeHandler.bind(this))
    this.controls?.addEventListener('dragging-changed', (event) => {
      if (!this.display.visible) return
      const val = !!event.value
      if (val) {
        this.emit(SectionToolEvent.DragStart)
        this.dragging = val
        this.cameraProvider.enabled = !val
      } else {
        this.emit(SectionToolEvent.DragEnd)
        setTimeout(() => {
          this.dragging = val
          this.cameraProvider.enabled = !val
        }, 100)
      }
    })
    this.viewer.requestRender()
  }

  private _draggingChangeHandler() {
    if (!this.display.visible) return

    this.boxGeometry.computeBoundingBox()
    this.boxMeshHelper.box.copy(this.boxGeometry.boundingBox || new Box3())

    if (this.dragging) {
      // Dragging a side / plane
      if (this.currentRange) {
        this._generateOrUpdatePlanes()
        if (this.prevPosition === null)
          this.prevPosition = this.hoverPlane.position.clone()
        this.prevPosition.sub(this.hoverPlane.position)
        this.prevPosition.negate()
        const boxArr = this.boxGeometry.attributes.position.array as number[]
        for (let i = 0; i < this.currentRange.length; i++) {
          const index = this.currentRange[i]
          boxArr[3 * index] += this.prevPosition.x
          boxArr[3 * index + 1] += this.prevPosition.y
          boxArr[3 * index + 2] += this.prevPosition.z
        }

        this.prevPosition = this.hoverPlane.position.clone()
        this.boxGeometry.attributes.position.needsUpdate = true
        this.boxGeometry.computeVertexNormals()
        this.boxGeometry.computeBoundingBox()
        this.boxGeometry.computeBoundingSphere()
      }

      // Dragging the whole section box. This legacy bit seems to never happen ¯\_(ツ)_/¯
      else {
        this._generateOrUpdatePlanes()
        if (this.prevPosition === null) this.prevPosition = this.sphere.position.clone()
        this.prevPosition.sub(this.sphere.position)
        this.prevPosition.negate()
        const verts = this.boxGeometry.attributes.position.array as number[]
        for (let i = 0; i < verts.length; i += 3) {
          verts[i] += this.prevPosition.x
          verts[i + 1] += this.prevPosition.y
          verts[i + 2] += this.prevPosition.z
        }
        this.boxGeometry.attributes.position.needsUpdate = true
        this.boxGeometry.computeVertexNormals()
        this.boxGeometry.computeBoundingBox()
        this.boxGeometry.computeBoundingSphere()

        this.prevPosition = this.sphere.position.clone()
      }
      this.viewer.getRenderer().clippingPlanes = this.planes
      this.viewer.getRenderer().clippingVolume = this.getBox()
      this.emit(SectionToolEvent.Updated, this.planes)
    }
    this.viewer.requestRender()
  }

  private clickHandler(args: Vector2 & { event: PointerEvent; multiSelect: boolean }) {
    if (!this.allowSelection || this.dragging) return

    this.raycaster.setFromCamera(args, this.cameraProvider.renderingCamera)
    let intersectedObjects: Array<Intersection> = []
    if (this.display.visible) {
      intersectedObjects = this.raycaster.intersectObject(this.boxMesh)
    }

    if (intersectedObjects.length === 0 && !this.dragging) {
      this._attachControlsToBox()
      ;(this.boxMeshHelper.material as Material).opacity = 0.5
      this.attachedToBox = true
      return
    }
    this.attachedToBox = false
    ;(this.boxMeshHelper.material as Material).opacity = 0.3
    this.hoverPlane.visible = true
    const side =
      this.sidesSimple[
        `${intersectedObjects[0].face?.a}${intersectedObjects[0].face?.b}${intersectedObjects[0].face?.c}`
      ]
    /** Catering to typescript
     *  We're intersection an indexed mesh. There will always be an intersected face
     */
    if (!side) {
      throw new Error('Cannot determine section side')
    }
    this.controls.showX = side.axis === 'x'
    this.controls.showY = side.axis === 'y'
    this.controls.showZ = side.axis === 'z'

    this.currentRange = side.verts

    const boxArr = this.boxGeometry.attributes.position
    let index = 0
    const planeArr = this.plane.attributes.position.array as number[]
    const centre = new Vector3()

    const tempArr = []
    for (let i = 0; i < planeArr.length; i++) {
      if (i % 3 === 0) {
        tempArr.push(boxArr.getX(this.currentRange[index]))
      } else if (i % 3 === 1) {
        tempArr.push(boxArr.getY(this.currentRange[index]))
      } else if (i % 3 === 2) {
        tempArr.push(boxArr.getZ(this.currentRange[index]))
        centre.add(new Vector3(tempArr[i - 2], tempArr[i - 1], tempArr[i]))
        index++
      }
    }

    centre.multiplyScalar(0.25)
    this.hoverPlane.position.copy(centre.applyMatrix4(this.boxMesh.matrixWorld))
    this.prevPosition = this.hoverPlane.position.clone()
    index = 0
    for (let i = 0; i < planeArr.length; i++) {
      if (i % 3 === 0) {
        planeArr[i] = boxArr.getX(this.currentRange[index]) - centre.x
      } else if (i % 3 === 1) {
        planeArr[i] = boxArr.getY(this.currentRange[index]) - centre.y
      } else if (i % 3 === 2) {
        planeArr[i] = boxArr.getZ(this.currentRange[index]) - centre.z
        index++
      }
    }

    this.plane.applyMatrix4(this.boxMesh.matrixWorld)
    this.plane.attributes.position.needsUpdate = true
    this.plane.computeBoundingSphere()
    this.plane.computeBoundingBox()
    this.controls?.detach()
    this.controls?.attach(this.hoverPlane)
    this.controls?.updateMatrixWorld()
  }

  private _generateSimpleCube(width = 0.5, depth = 0.5, height = 0.5) {
    const vertices = [
      [-1 * width, -1 * depth, -1 * height],
      [1 * width, -1 * depth, -1 * height],
      [1 * width, 1 * depth, -1 * height],
      [-1 * width, 1 * depth, -1 * height],
      [-1 * width, -1 * depth, 1 * height],
      [1 * width, -1 * depth, 1 * height],
      [1 * width, 1 * depth, 1 * height],
      [-1 * width, 1 * depth, 1 * height]
    ]

    const indexes = [
      0, 1, 3, 3, 1, 2, 1, 5, 2, 2, 5, 6, 5, 4, 6, 6, 4, 7, 4, 0, 7, 7, 0, 3, 3, 2, 7,
      7, 2, 6, 4, 5, 0, 0, 5, 1
    ]

    const positions = []
    for (const vert of vertices) {
      positions.push(...vert)
    }

    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    g.setIndex(indexes)
    g.computeBoundingBox()
    g.computeVertexNormals()
    return g
  }

  private _generateOrUpdatePlanes() {
    this.planes = this.planes || [
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane()
    ]

    let index = 0
    const boxArr = this.boxGeometry.attributes.position
    const indexes = [
      0, 1, 3, 3, 1, 2, 1, 5, 2, 2, 5, 6, 5, 4, 6, 6, 4, 7, 4, 0, 7, 7, 0, 3, 3, 2, 7,
      7, 2, 6, 4, 5, 0, 0, 5, 1
    ]

    for (let i = 0; i < indexes.length; i += 6) {
      const a = new Vector3(
        boxArr.getX(indexes[i]),
        boxArr.getY(indexes[i]),
        boxArr.getZ(indexes[i])
      )
      const b = new Vector3(
        boxArr.getX(indexes[i + 1]),
        boxArr.getY(indexes[i + 1]),
        boxArr.getZ(indexes[i + 1])
      )
      const c = new Vector3(
        boxArr.getX(indexes[i + 2]),
        boxArr.getY(indexes[i + 2]),
        boxArr.getZ(indexes[i + 2])
      )
      const plane = this.planes[index]
      plane.setFromCoplanarPoints(a, b, c)
      index++
    }
  }

  private _attachControlsToBox() {
    this.controls?.detach()

    const centre = new Vector3()
    const boxArr = this.boxGeometry.attributes.position.array
    for (let i = 0; i < boxArr.length; i += 3) {
      centre.add(new Vector3(boxArr[i], boxArr[i + 1], boxArr[i + 2]))
    }
    centre.multiplyScalar(1 / 8)
    this.sphere.position.copy(centre)

    this.boxMesh.geometry.computeBoundingSphere()
    this.boxMesh.geometry.computeBoundingBox()
    this.controls?.attach(this.sphere)
    this.currentRange = null
    this.prevPosition = null
    this.hoverPlane.visible = false
    this.controls.showX = true
    this.controls.showY = true
    this.controls.showZ = true
  }

  public getBox(): Box3 {
    if (!this.display.visible) return new Box3()
    return this.boxGeometry.boundingBox || new Box3()
  }

  public setBox(targetBox: Box3, offset = 0): void {
    let box

    if (targetBox) box = targetBox
    else {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }

    if (box.min.x === Infinity) {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }

    let x1, y1, z1, x2, y2, z2

    if (offset === 0) {
      const offsetBox = this.viewer.World.getRelativeOffsetBox(box, 0.0001)
      x1 = offsetBox.min.x //box.min.x - (box.max.x - box.min.x) * offset
      y1 = offsetBox.min.y //box.min.y - (box.max.y - box.min.y) * offset
      z1 = offsetBox.min.z //box.min.z - (box.max.z - box.min.z) * offset
      x2 = offsetBox.max.x //box.max.x + (box.max.x - box.min.x) * offset
      y2 = offsetBox.max.y //box.max.y + (box.max.y - box.min.y) * offset
      z2 = offsetBox.max.z //box.max.z + (box.max.z - box.min.z) * offset
    } else {
      x1 = box.min.x - (box.max.x - box.min.x) * offset
      y1 = box.min.y - (box.max.y - box.min.y) * offset
      z1 = box.min.z - (box.max.z - box.min.z) * offset
      x2 = box.max.x + (box.max.x - box.min.x) * offset
      y2 = box.max.y + (box.max.y - box.min.y) * offset
      z2 = box.max.z + (box.max.z - box.min.z) * offset
    }

    const newVertices = [
      x1,
      y1,
      z1,
      x2,
      y1,
      z1,
      x2,
      y2,
      z1,
      x1,
      y2,
      z1,
      x1,
      y1,
      z2,
      x2,
      y1,
      z2,
      x2,
      y2,
      z2,
      x1,
      y2,
      z2
    ]

    const boxVerts = this.boxGeometry.attributes.position.array as number[]
    for (let i = 0; i < newVertices.length; i++) {
      boxVerts[i] = newVertices[i]
    }

    this.boxGeometry.attributes.position.needsUpdate = true
    this.boxGeometry.computeVertexNormals()
    this.boxGeometry.computeBoundingBox()
    this.boxGeometry.computeBoundingSphere()
    this._generateOrUpdatePlanes()
    this._attachControlsToBox()
    this.boxMeshHelper.box.copy(this.boxGeometry.boundingBox || new Box3())
    this.emit(SectionToolEvent.Updated, this.planes)
    this.viewer.getRenderer().clippingPlanes = this.planes
    this.viewer.getRenderer().clippingVolume = this.getBox()
    this.viewer.requestRender()
  }

  public toggle(): void {
    this.enabled = !this._enabled
  }
}
