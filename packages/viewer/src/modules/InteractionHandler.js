import * as THREE from 'three'
import SelectionHelper from './SelectionHelper'

export default class InteractionHandler {
  constructor(viewer) {
    this.viewer = viewer
    this.preventSelection = false

    this.selectionHelper = new SelectionHelper(this.viewer, {
      sectionBox: this.sectionBox,
      hover: false
    })
    this.selectionMeshMaterial = new THREE.MeshLambertMaterial({
      color: 0x0b55d2,
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: true,
      opacity: 0.3
    })
    this.selectionMeshMaterial.clippingPlanes = this.viewer.sectionBox.planes
    // Fix overlapping faces flickering
    this.selectionMeshMaterial.polygonOffset = true
    this.selectionMeshMaterial.polygonOffsetFactor = -0.1

    this.selectionLineMaterial = new THREE.LineBasicMaterial({ color: 0x0b55d2 })
    this.selectionLineMaterial.clippingPlanes = this.viewer.sectionBox.planes

    this.selectionEdgesMaterial = new THREE.LineBasicMaterial({ color: 0x23f3bd })
    this.selectionEdgesMaterial.clippingPlanes = this.viewer.sectionBox.planes

    this.selectedObjects = new THREE.Group()
    this.viewer.scene.add(this.selectedObjects)
    this.selectedObjects.renderOrder = 1000
    this.selectionBox = new THREE.Group()
    this.viewer.scene.add(this.selectionBox)

    this.overlayMeshMaterial = new THREE.MeshLambertMaterial({
      color: 0x57f7ff,
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: true,
      opacity: 0.7
    })
    this.overlayMeshMaterial.clippingPlanes = this.viewer.sectionBox.planes
    this.overlaidObjects = new THREE.Group()
    this.viewer.scene.add(this.overlaidObjects)
    this.overlaidObjects.renderOrder = 2000

    this.selectedObjectsUserData = []
    this.selectedRawObjects = []

    this.selectionHelper.on('object-doubleclicked', this._handleDoubleClick.bind(this))
    this.selectionHelper.on('object-clicked', this._handleSelect.bind(this))

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.viewer.mouseOverRenderer) {
        this.deselectObjects()
      }
    })
  }

  // used to display objects selected by other users
  overlayObjects(ids = []) {
    this.overlaidObjects.clear()

    const all = this.viewer.sceneManager.allObjects
    const subsetToAdd = all.filter((obj) => ids.indexOf(obj.uuid) !== -1)

    for (const obj of subsetToAdd) {
      const selType = obj.type
      switch (selType) {
        case 'Group': {
          const blockObjs = this.getBlockObjectsCloned(obj)
          for (const child of blockObjs) {
            child.material = this.overlayMeshMaterial
            this.overlaidObjects.add(child)
          }
          break
        }
        case 'Mesh':
          this.overlaidObjects.add(
            new THREE.Mesh(obj.geometry, this.overlayMeshMaterial)
          )
          break
        case 'Line':
          this.overlaidObjects.add(
            new THREE.Line(obj.geometry, this.overlayMeshMaterial)
          )
          break
      }
    }
    this.viewer.needsRender = true
  }

  _handleDoubleClick(objs) {
    if (!objs || objs.length === 0) {
      if (this.viewer.sectionBox.display.visible) {
        this.zoomToObject(this.viewer.sectionBox.cube)
      } else {
        this.zoomExtents()
      }
    } else this.zoomToObject(objs[0].object)
    this.viewer.needsRender = true
    this.viewer.emit(
      'object-doubleclicked',
      objs && objs.length !== 0 ? objs[0].object : null,
      objs && objs.length !== 0 ? objs[0].point : null
    )
  }

  _handleSelect(objs) {
    if (this.viewer.cameraHandler.orbiting) return
    if (this.preventSelection) return

    if (objs.length === 0) {
      this.deselectObjects()
      return
    }

    if (!this.selectionHelper.multiSelect) this.deselectObjects()

    let selType = objs[0].object.type
    let rootBlock = null
    if (
      objs[0].object.parent?.userData?.speckle_type
        ?.toLowerCase()
        .includes('blockinstance')
    ) {
      selType = 'Block'
      rootBlock = this.getParentBlock(objs[0].object.parent)
    }

    const objId =
      selType === 'Block' ? rootBlock.userData.id : objs[0].object.userData.id
    const objIdIndexCheck = this.selectedObjectsUserData.findIndex(
      (o) => o.id === objId
    )
    if (objIdIndexCheck !== -1) {
      if (this.selectionHelper.multiSelect) {
        // TODO: deselect if in multiple selection mode
        this.selectedObjectsUserData.splice(objIdIndexCheck, 1)
        this.deselectObj(rootBlock ? rootBlock.userData.id : objs[0].object.userData.id)
      }
      return
    }

    switch (selType) {
      case 'Block': {
        const blockObjs = this.getBlockObjectsCloned(rootBlock)
        for (const child of blockObjs) {
          child.userData = { id: rootBlock.userData.id }
          child.material = this.selectionMeshMaterial
          this.selectedObjects.add(child)
          //this.viewer.outlinePass.selectedObjects.push( child )
        }
        break
      }
      case 'Mesh': {
        const m = new THREE.Mesh(objs[0].object.geometry, this.selectionMeshMaterial)
        m.userData = { id: objs[0].object.userData.id }
        this.selectedObjects.add(m)
        //this.viewer.outlinePass.selectedObjects.push( new THREE.Mesh( objs[0].object.geometry, this.selectionMeshMaterial ) )
        break
      }
      case 'Line': {
        const l = new THREE.Line(objs[0].object.geometry, this.selectionMeshMaterial)
        l.userData = { id: objs[0].object.userData.id }
        this.selectedObjects.add(l)
        //this.viewer.outlinePass.selectedObjects.push( new THREE.Line( objs[0].object.geometry, this.selectionMeshMaterial ) )
        break
      }
      case 'Point':
        console.warn('Point selection not implemented.')
        return // exit the whole func here, points cause all sorts of trouble when being selected (ie, bbox stuff)
    }

    if (selType === 'Block') {
      this.selectedObjectsUserData.push(rootBlock.userData)
      this.selectedRawObjects.push(rootBlock)
    } else {
      this.selectedObjectsUserData.push(objs[0].object.userData)
      this.selectedRawObjects.push(objs[0])
    }

    const box = new THREE.Box3().setFromObject(this.selectedObjects)
    const boxHelper = new THREE.Box3Helper(box, 0x047efb)
    this.selectionBox.clear()
    this.selectionBox.add(boxHelper)
    this.viewer.needsRender = true

    const selectionCenter = new THREE.Vector3()
    box.getCenter(selectionCenter)
    const selectionInfo = {
      userData: this.selectedObjectsUserData,
      location: objs[0].point,
      selectionCenter
    }
    this.viewer.emit('select', selectionInfo)
  }

  getParentBlock(block) {
    if (block.parent?.userData?.speckle_type?.toLowerCase().includes('blockinstance')) {
      return this.getParentBlock(block.parent)
    } else return block
  }

  getBlockObjectsCloned(block, objects = []) {
    for (const child of block.children) {
      if (child instanceof THREE.Group) {
        objects.push(...this.getBlockObjectsCloned(child))
      } else {
        objects.push(child.clone())
      }
    }
    for (const child of objects) {
      child.geometry = child.geometry.clone().applyMatrix4(block.matrix)
    }
    return objects
  }

  deselectObj(id) {
    const objToRemove = this.selectedObjects.children.filter(
      (o) => o.userData.id === id
    )
    for (const o of objToRemove) this.selectedObjects.remove(o)

    this.selectionBox.clear()
    if (this.selectedObjects.children.length !== 0) {
      const box = new THREE.Box3().setFromObject(this.selectedObjects)
      const boxHelper = new THREE.Box3Helper(box, 0x047efb)
      this.selectionBox.add(boxHelper)
    }
    this.viewer.needsRender = true
  }

  deselectObjects() {
    this.selectedObjects.clear()
    this.selectionBox.clear()
    this.selectedObjectsUserData = []
    this.selectedRawObjects = []
    this.viewer.needsRender = true
    this.viewer.emit('select', { userData: [], location: null })
  }

  zoomToObjectId(id) {
    const obj = this.viewer.sceneManager.allObjects.find((o) => o.uuid === id)
    if (obj) this.zoomToObject(obj)
    else console.warn(`No object with id of ${id} found.`)
  }

  zoomToObject(target, fit = 1.2, transition = true) {
    const box = new THREE.Box3().setFromObject(target)
    this.zoomToBox(box, fit, transition)
  }

  zoomExtents(fit = 1.2, transition = true) {
    if (this.viewer.sectionBox.display.visible) {
      this.zoomToObject(this.viewer.sectionBox.cube)
      return
    }
    if (this.viewer.sceneManager.sceneObjects.objectsInScene.length === 0) {
      const box = new THREE.Box3(
        new THREE.Vector3(-1, -1, -1),
        new THREE.Vector3(1, 1, 1)
      )
      this.zoomToBox(box, fit, transition)
      return
    }

    const box = new THREE.Box3().setFromObject(
      this.viewer.sceneManager.sceneObjects.objectsInScene
    )
    this.zoomToBox(box, fit, transition)
    // this.viewer.controls.setBoundary( box )
  }

  zoomToBox(box, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))
    }
    const fitOffset = fit

    const size = box.getSize(new THREE.Vector3())
    const target = new THREE.Sphere()
    box.getBoundingSphere(target)
    target.radius = target.radius * fitOffset

    const maxSize = Math.max(size.x, size.y, size.z)
    const camFov = this.viewer.cameraHandler.camera.fov
      ? this.viewer.cameraHandler.camera.fov
      : 55
    const camAspect = this.viewer.cameraHandler.camera.aspect
      ? this.viewer.cameraHandler.camera.aspect
      : 1.2
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camFov) / 360))
    const fitWidthDistance = fitHeightDistance / camAspect
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)

    this.viewer.cameraHandler.controls.fitToSphere(target, transition)

    this.viewer.cameraHandler.controls.minDistance = distance / 100
    this.viewer.cameraHandler.controls.maxDistance = distance * 100
    this.viewer.cameraHandler.camera.near = distance / 100
    this.viewer.cameraHandler.camera.far = distance * 100
    this.viewer.cameraHandler.camera.updateProjectionMatrix()

    if (this.viewer.cameraHandler.activeCam.name === 'ortho') {
      this.viewer.cameraHandler.orthoCamera.far = distance * 100
      this.viewer.cameraHandler.orthoCamera.updateProjectionMatrix()

      // fit the camera inside, so we don't have clipping plane issues.
      // WIP implementation
      const camPos = this.viewer.cameraHandler.orthoCamera.position
      let dist = target.distanceToPoint(camPos)
      if (dist < 0) {
        dist *= -1
        this.viewer.cameraHandler.controls.setPosition(
          camPos.x + dist,
          camPos.y + dist,
          camPos.z + dist
        )
      }
    }
  }

  rotateCamera(azimuthAngle = 0.261799, polarAngle = 0, transition = true) {
    this.viewer.cameraHandler.controls.rotate(azimuthAngle, polarAngle, transition)
  }

  screenshot() {
    const sectionBoxVisible = this.viewer.sectionBox.display.visible
    if (sectionBoxVisible) {
      this.viewer.sectionBox.displayOff()
      this.viewer.needsRender = true
      this.viewer.render()
    }
    const screenshot = this.viewer.renderer.domElement.toDataURL('image/png')
    if (sectionBoxVisible) {
      this.viewer.sectionBox.displayOn()
    }
    return screenshot
  }

  /**
   * Rotates camera to some canonical views
   * @param  {string}  side       Can be any of front, back, up (top), down (bottom), right, left.
   * @param  {Number}  fit        [description]
   * @param  {Boolean} transition [description]
   * @return {[type]}             [description]
   */
  rotateTo(side, transition = true) {
    const DEG90 = Math.PI * 0.5
    const DEG180 = Math.PI

    switch (side) {
      case 'front':
        this.viewer.cameraHandler.controls.rotateTo(0, DEG90, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case 'back':
        this.viewer.cameraHandler.controls.rotateTo(DEG180, DEG90, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case 'up':
      case 'top':
        this.viewer.cameraHandler.controls.rotateTo(0, 0, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case 'down':
      case 'bottom':
        this.viewer.cameraHandler.controls.rotateTo(0, DEG180, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case 'right':
        this.viewer.cameraHandler.controls.rotateTo(DEG90, DEG90, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case 'left':
        this.viewer.cameraHandler.controls.rotateTo(-DEG90, DEG90, transition)
        if (this.viewer.cameraHandler.activeCam.name === 'ortho')
          this.viewer.cameraHandler.disableRotations()
        break

      case '3d':
      case '3D':
      default: {
        let box
        if (this.viewer.sceneManager.sceneObjects.allObjects.children.length === 0)
          box = new THREE.Box3(
            new THREE.Vector3(-1, -1, -1),
            new THREE.Vector3(1, 1, 1)
          )
        else
          box = new THREE.Box3().setFromObject(
            this.viewer.sceneManager.sceneObjects.allObjects
          )
        if (box.max.x === Infinity || box.max.x === -Infinity) {
          box = new THREE.Box3(
            new THREE.Vector3(-1, -1, -1),
            new THREE.Vector3(1, 1, 1)
          )
        }
        this.viewer.cameraHandler.controls.setPosition(
          box.max.x,
          box.max.y,
          box.max.z,
          transition
        )
        this.zoomExtents()
        this.viewer.cameraHandler.enableRotations()
        break
      }
    }
  }

  getViews() {
    return this.viewer.sceneManager.views.map((v) => {
      return { name: v.applicationId, id: v.id, view: v }
    })
  }

  setView(id, transition = true) {
    if (!id) return
    const view = this.viewer.sceneManager.views.find((v) => v.id === id)
    if (!view) {
      console.warn(`View id ${id} not found.`)
      return
    }

    const target = view.target
    const position = view.origin

    this.viewer.cameraHandler.activeCam.controls.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      transition
    )
  }

  setLookAt(position, target, transition = true) {
    if (!position || !target) return
    this.viewer.cameraHandler.activeCam.controls.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      transition
    )
  }
}
