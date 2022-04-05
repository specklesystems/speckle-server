import * as THREE from 'three'
import SelectionHelper from './SelectionHelper'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { Box3 } from 'three'

export default class SectionBox {
  constructor(viewer) {
    this.viewer = viewer

    this.viewer.renderer.localClippingEnabled = true

    this.dragging = false
    this.display = new THREE.Group()
    this.display.name = 'SectionBox'
    this.viewer.scene.add(this.display)

    // box
    this.boxGeometry = this._generateSimpleCube(5, 5, 5)
    this.material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      opacity: 0,
      wireframe: false,
      side: THREE.DoubleSide
    })
    this.cube = new THREE.Mesh(this.boxGeometry, this.material)
    this.cube.visible = false

    this.display.add(this.cube)

    this.boxHelper = new THREE.BoxHelper(this.cube, 0x0a66ff)
    this.boxHelper.material.opacity = 0.4
    this.display.add(this.boxHelper)

    // we're attaching the gizmo mover to this sphere in the box centre
    const sphere = new THREE.SphereGeometry(0.01, 10, 10)
    this.sphere = new THREE.Mesh(
      sphere,
      new THREE.MeshStandardMaterial({ color: 0x00ffff })
    )
    this.sphere.visible = false
    this.display.add(this.sphere)

    // plane
    this.plane = new THREE.PlaneGeometry(1, 1)
    this.hoverPlane = new THREE.Mesh(
      this.plane,
      new THREE.MeshStandardMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 0.1,
        wireframe: false,
        color: 0x0a66ff,
        metalness: 0.1,
        roughness: 0.75
      })
    )
    this.hoverPlane.visible = false
    this.display.add(this.hoverPlane)

    this.dragging = false
    this._setupControls()

    this.sidesSimple = {
      256: { verts: [1, 2, 5, 6], axis: 'x' },
      152: { verts: [1, 2, 5, 6], axis: 'x' },
      407: { verts: [0, 3, 4, 7], axis: 'x' },
      703: { verts: [0, 3, 4, 7], axis: 'x' },
      327: { verts: [2, 3, 6, 7], axis: 'y' },
      726: { verts: [2, 3, 6, 7], axis: 'y' },
      450: { verts: [0, 1, 4, 5], axis: 'y' },
      '051': { verts: [0, 1, 4, 5], axis: 'y' },
      312: { verts: [0, 1, 3, 2], axis: 'z' },
      '013': { verts: [0, 1, 3, 2], axis: 'z' },
      546: { verts: [4, 5, 7, 6], axis: 'z' },
      647: { verts: [4, 5, 7, 6], axis: 'z' }
    }

    this._generateOrUpdatePlanes()

    this.currentRange = null
    this.prevPosition = null
    this.attachedToBox = true

    this.selectionHelper = new SelectionHelper(this.viewer, {
      subset: [this.cube],
      hover: false,
      checkForSectionBoxInclusion: false
    })
    this.selectionHelper.on('object-clicked', this._clickHandler.bind(this))
    this.selectionHelper.on('hovered', () => {
      // TODO: cannot get this to work reliably
      // if( !this.attachedToBox ) return
      // if( objs.length === 0 ) {
      //   this.controls.visible = false
      //   this.viewer.needsRender = true
      // }
      // else if( objs.length !== 0 ) {
      //   this.controls.visible = true
      //   this.viewer.needsRender = true
      // }
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.viewer.mouseOverRenderer) {
        this._attachControlsToBox()
      }
    })

    this._attachControlsToBox()

    this.viewer.on(
      'projection-change',
      function () {
        this._setupControls()
        this._attachControlsToBox()
      }.bind(this)
    )
  }

  _setupControls() {
    this.controls?.dispose()
    this.controls?.detach()
    this.controls = new TransformControls(
      this.viewer.cameraHandler.activeCam.camera,
      this.viewer.renderer.domElement
    )
    this.controls.setSize(0.75)
    this.display.add(this.controls)
    this.controls.addEventListener('change', this._draggingChangeHandler.bind(this))
    this.controls.addEventListener('dragging-changed', (event) => {
      if (!this.display.visible) return
      const val = !!event.value
      if (val) {
        this.dragging = val
        this.viewer.interactions.preventSelection = val
        this.viewer.cameraHandler.enabled = !val
      } else {
        setTimeout(() => {
          this.dragging = val
          this.viewer.interactions.preventSelection = val
          this.viewer.cameraHandler.enabled = !val
        }, 100)
      }
    })
    this.viewer.needsRender = true
  }

  _draggingChangeHandler() {
    if (!this.display.visible) return
    this.boxHelper.update()
    this._generateOrUpdatePlanes()

    // Dragging a side / plane
    if (this.dragging && this.currentRange) {
      if (this.prevPosition === null)
        this.prevPosition = this.hoverPlane.position.clone()
      this.prevPosition.sub(this.hoverPlane.position)
      this.prevPosition.negate()
      const boxArr = this.boxGeometry.attributes.position.array
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

    // Dragging the whole section box
    if (this.dragging && !this.currentRange) {
      if (this.prevPosition === null) this.prevPosition = this.sphere.position.clone()
      this.prevPosition.sub(this.sphere.position)
      this.prevPosition.negate()

      for (let i = 0; i < this.boxGeometry.attributes.position.array.length; i += 3) {
        this.boxGeometry.attributes.position.array[i] += this.prevPosition.x
        this.boxGeometry.attributes.position.array[i + 1] += this.prevPosition.y
        this.boxGeometry.attributes.position.array[i + 2] += this.prevPosition.z
      }
      this.boxGeometry.attributes.position.needsUpdate = true
      this.boxGeometry.computeVertexNormals()
      this.boxGeometry.computeBoundingBox()
      this.boxGeometry.computeBoundingSphere()

      this.prevPosition = this.sphere.position.clone()
    }
    this.viewer.needsRender = true
  }

  _clickHandler(args) {
    if (this.viewer.cameraHandler.orbiting || this.dragging) return
    if (args.length === 0 && !this.dragging) {
      this._attachControlsToBox()
      this.boxHelper.material.opacity = 0.5
      this.attachedToBox = true
      return
    }
    this.attachedToBox = false
    this.boxHelper.material.opacity = 0.3
    this.hoverPlane.visible = true
    const side = this.sidesSimple[`${args[0].face.a}${args[0].face.b}${args[0].face.c}`]
    this.controls.showX = side.axis === 'x'
    this.controls.showY = side.axis === 'y'
    this.controls.showZ = side.axis === 'z'

    this.currentRange = side.verts

    const boxArr = this.boxGeometry.attributes.position
    let index = 0
    const planeArr = this.plane.attributes.position.array
    const centre = new THREE.Vector3()

    const tempArr = []
    for (let i = 0; i < planeArr.length; i++) {
      if (i % 3 === 0) {
        tempArr.push(boxArr.getX(this.currentRange[index]))
      } else if (i % 3 === 1) {
        tempArr.push(boxArr.getY(this.currentRange[index]))
      } else if (i % 3 === 2) {
        tempArr.push(boxArr.getZ(this.currentRange[index]))
        centre.add(new THREE.Vector3(tempArr[i - 2], tempArr[i - 1], tempArr[i]))
        index++
      }
    }

    centre.multiplyScalar(0.25)
    this.hoverPlane.position.copy(centre.applyMatrix4(this.cube.matrixWorld))
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

    this.plane.applyMatrix4(this.cube.matrixWorld)
    this.plane.attributes.position.needsUpdate = true
    this.plane.computeBoundingSphere()
    this.plane.computeBoundingBox()
    this.controls.detach()
    this.controls.attach(this.hoverPlane)
    this.controls.updateMatrixWorld()
  }

  _generateSimpleCube(width = 0.5, depth = 0.5, height = 0.5) {
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

    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    )
    g.setIndex(indexes)
    g.computeVertexNormals()
    return g
  }

  _generateOrUpdatePlanes() {
    this.planes = this.planes || [
      new THREE.Plane(),
      new THREE.Plane(),
      new THREE.Plane(),
      new THREE.Plane(),
      new THREE.Plane(),
      new THREE.Plane()
    ]

    let index = 0
    const boxArr = this.boxGeometry.attributes.position
    const indexes = [
      0, 1, 3, 3, 1, 2, 1, 5, 2, 2, 5, 6, 5, 4, 6, 6, 4, 7, 4, 0, 7, 7, 0, 3, 3, 2, 7,
      7, 2, 6, 4, 5, 0, 0, 5, 1
    ]

    for (let i = 0; i < indexes.length; i += 6) {
      const a = new THREE.Vector3(
        boxArr.getX(indexes[i]),
        boxArr.getY(indexes[i]),
        boxArr.getZ(indexes[i])
      )
      const b = new THREE.Vector3(
        boxArr.getX(indexes[i + 1]),
        boxArr.getY(indexes[i + 1]),
        boxArr.getZ(indexes[i + 1])
      )
      const c = new THREE.Vector3(
        boxArr.getX(indexes[i + 2]),
        boxArr.getY(indexes[i + 2]),
        boxArr.getZ(indexes[i + 2])
      )
      const plane = this.planes[index]
      plane.setFromCoplanarPoints(a, b, c)
      index++
    }
  }

  _attachControlsToBox() {
    this.controls.detach()

    const centre = new THREE.Vector3()
    const boxArr = this.boxGeometry.attributes.position.array
    for (let i = 0; i < boxArr.length; i += 3) {
      centre.add(new THREE.Vector3(boxArr[i], boxArr[i + 1], boxArr[i + 2]))
    }
    centre.multiplyScalar(1 / 8)
    this.sphere.position.copy(centre)

    this.cube.geometry.computeBoundingSphere()
    this.cube.geometry.computeBoundingBox()
    this.controls.attach(this.sphere)
    this.currentRange = null
    this.prevPosition = null
    this.hoverPlane.visible = false
    this.controls.showX = true
    this.controls.showY = true
    this.controls.showZ = true
  }

  setBox(targetBox, offset = 0.05) {
    let box

    if (targetBox) box = targetBox
    else {
      if (this.viewer.interactions.selectedObjects.children.length !== 0) {
        box = new THREE.Box3().setFromObject(this.viewer.interactions.selectedObjects)
      } else if (
        this.viewer.sceneManager.sceneObjects.allObjects.children.length !== 0
      ) {
        box = new THREE.Box3().setFromObject(
          this.viewer.sceneManager.sceneObjects.allObjects
        )
      } else {
        box = new Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
      }
    }

    if (box.min.x === Infinity) {
      box = new Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
    }

    const x1 = box.min.x - (box.max.x - box.min.x) * offset
    const y1 = box.min.y - (box.max.y - box.min.y) * offset
    const z1 = box.min.z - (box.max.z - box.min.z) * offset
    const x2 = box.max.x + (box.max.x - box.min.x) * offset
    const y2 = box.max.y + (box.max.y - box.min.y) * offset
    const z2 = box.max.z + (box.max.z - box.min.z) * offset

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

    const boxVerts = this.boxGeometry.attributes.position.array
    for (let i = 0; i < newVertices.length; i++) {
      boxVerts[i] = newVertices[i]
    }

    this.boxGeometry.attributes.position.needsUpdate = true
    this.boxGeometry.computeVertexNormals()
    this.boxGeometry.computeBoundingBox()
    this.boxGeometry.computeBoundingSphere()
    this._generateOrUpdatePlanes()
    this._attachControlsToBox()
    this.boxHelper.update()
    this.viewer.needsRender = true
  }

  toggle() {
    this.setBox()
    this.display.visible = !this.display.visible
    this.viewer.renderer.localClippingEnabled = this.display.visible
    this.viewer.needsRender = true
  }

  off() {
    this.display.visible = false
    this.viewer.renderer.localClippingEnabled = false
    this.viewer.needsRender = true
  }

  on() {
    this.display.visible = true
    this.viewer.renderer.localClippingEnabled = true
    this.viewer.needsRender = true
  }

  displayOff() {
    this.display.visible = false
  }

  displayOn() {
    this.display.visible = true
  }

  getCurrentBox() {
    if (!this.display.visible) return null
    const box = new THREE.Box3().setFromBufferAttribute(
      this.boxGeometry.attributes.position
    )
    return box
  }
}
