import {
  ACESFilmicToneMapping,
  Box3,
  Box3Helper,
  Camera,
  Color,
  DirectionalLight,
  Group,
  Intersection,
  Mesh,
  Object3D,
  Plane,
  Scene,
  Sphere,
  Spherical,
  sRGBEncoding,
  Texture,
  Vector3,
  VSMShadowMap,
  WebGLRenderer
} from 'three'
import { Batch, GeometryType } from './batching/Batch'
import Batcher from './batching/Batcher'
import { SpeckleType } from './converter/GeometryConverter'
import { FilterMaterial } from './FilteringManager'
import Input, { InputOptionsDefault } from './input/Input'
import { Intersections } from './Intersections'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { NodeRenderView } from './tree/NodeRenderView'
import { Viewer } from './Viewer'
import { WorldTree } from './tree/WorldTree'
import { SelectionEvent } from '../IViewer'

export default class SpeckleRenderer {
  private readonly SHOW_HELPERS = true
  private _renderer: WebGLRenderer
  public scene: Scene
  private rootGroup: Group
  private batcher: Batcher
  private intersections: Intersections
  private input: Input
  private sun: DirectionalLight
  private sunTarget: Object3D
  public viewer: Viewer // TEMPORARY
  private filterBatchRecording: string[]

  public get renderer(): WebGLRenderer {
    return this._renderer
  }

  public set indirectIBL(texture: Texture) {
    this.scene.environment = texture
  }

  /** TEMPORARY for backwards compatibility */
  public get allObjects() {
    return this.scene.getObjectByName('ContentGroup')
  }

  public subtree(subtreeId: string) {
    return this.scene.getObjectByName(subtreeId)
  }

  public get sceneBox() {
    return new Box3().setFromObject(this.allObjects)
  }

  public get sceneSphere() {
    return this.sceneBox.getBoundingSphere(new Sphere())
  }

  public get sceneCenter() {
    return this.sceneBox.getCenter(new Vector3())
  }

  public constructor(viewer: Viewer /** TEMPORARY */) {
    this.scene = new Scene()
    this.rootGroup = new Group()
    this.rootGroup.name = 'ContentGroup'
    this.scene.add(this.rootGroup)

    this.batcher = new Batcher()
    this.intersections = new Intersections()
    this.viewer = viewer
  }

  public create(container: HTMLElement) {
    this._renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this._renderer.setClearColor(0xcccccc, 0)
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.outputEncoding = sRGBEncoding
    this._renderer.toneMapping = ACESFilmicToneMapping
    this._renderer.toneMappingExposure = 0.5
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = VSMShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.renderer.physicallyCorrectLights = true

    this._renderer.setSize(container.offsetWidth, container.offsetHeight)
    container.appendChild(this._renderer.domElement)

    this.input = new Input(this._renderer.domElement, InputOptionsDefault)
    this.input.on('object-clicked', this.onObjectClick.bind(this))
    this.input.on('object-clicked-debug', this.onObjectClickDebug.bind(this))
    this.input.on('object-doubleclicked', this.onObjectDoubleClick.bind(this))

    this.addDirectLights()
    if (this.SHOW_HELPERS) {
      const helpers = new Group()
      helpers.name = 'Helpers'
      this.scene.add(helpers)

      const sceneBoxHelper = new Box3Helper(this.sceneBox, new Color(0x0000ff))
      sceneBoxHelper.name = 'SceneBoxHelper'
      helpers.add(sceneBoxHelper)

      // const dirLightHelper = new DirectionalLightHelper(this.sun, 50, 0xff0000)
      // dirLightHelper.name = 'DirLightHelper'
      // helpers.add(dirLightHelper)

      // const camHelper = new CameraHelper(this.sun.shadow.camera)
      // camHelper.name = 'CamHelper'
      // helpers.add(camHelper)
    }
  }

  public update(deltaTime: number) {
    this.batcher.update(deltaTime)
  }

  public render(camera: Camera) {
    this.batcher.render(this.renderer)
    this.renderer.render(this.scene, camera)
  }

  public addRenderTree(subtreeId: string) {
    this.batcher.makeBatches(
      subtreeId,
      GeometryType.MESH,
      SpeckleType.Mesh,
      SpeckleType.Brep
    )
    this.batcher.makeBatches(
      subtreeId,
      GeometryType.LINE,
      SpeckleType.Line,
      SpeckleType.Curve,
      SpeckleType.Polycurve,
      SpeckleType.Polyline,
      SpeckleType.Arc,
      SpeckleType.Circle,
      SpeckleType.Ellipse
    )
    this.batcher.makeBatches(
      subtreeId,
      GeometryType.POINT,
      SpeckleType.Point,
      SpeckleType.Pointcloud
    )

    const subtreeGroup = new Group()
    subtreeGroup.name = subtreeId
    this.rootGroup.add(subtreeGroup)

    const batches = this.batcher.getBatches(subtreeId)
    batches.forEach((batch: Batch) => {
      const batchRenderable = batch.renderObject
      subtreeGroup.add(batch.renderObject)
      if ((batchRenderable as Mesh).isMesh) {
        const mesh = batchRenderable as unknown as Mesh
        const material = mesh.material as SpeckleStandardMaterial
        batchRenderable.castShadow = !material.transparent
        batchRenderable.receiveShadow = !material.transparent
      }
    })

    this.updateDirectLights(0.47, 0)
    this.updateHelpers()
  }

  public removeRenderTree(subtreeId: string) {
    this.rootGroup.remove(this.rootGroup.getObjectByName(subtreeId))
    this.batcher.purgeBatches(subtreeId)
    this.updateDirectLights(0.47, 0)
    this.updateHelpers()
  }

  public clearFilter() {
    this.batcher.resetBatchesDrawRanges()
    this.filterBatchRecording = []
  }

  public applyFilter(ids: NodeRenderView[], filterMaterial: FilterMaterial) {
    this.filterBatchRecording.push(
      ...this.batcher.setObjectsFilterMaterial(ids, filterMaterial)
    )
  }

  public beginFilter() {
    this.filterBatchRecording = []
  }

  public endFilter() {
    this.batcher.autoFillDrawRanges(this.filterBatchRecording)
    this.renderer.shadowMap.needsUpdate = true
  }

  public updateClippingPlanes(planes: Plane[]) {
    if (!this.allObjects) return
    /** This will be done via the batches in the near future */
    this.allObjects.traverse((object) => {
      const material = (object as unknown as { material }).material
      if (!material) return
      if (!Array.isArray(material)) {
        material.clippingPlanes = planes
      } else {
        for (let k = 0; k < material.length; k++) {
          material[k].clippingPlanes = planes
        }
      }
    })
  }

  private addDirectLights() {
    this.sun = new DirectionalLight(0xffffff, 5)
    this.sun.name = 'sun'
    this.scene.add(this.sun)

    this.sun.castShadow = true

    this.sun.shadow.mapSize.width = 2048
    this.sun.shadow.mapSize.height = 2048

    const d = 50

    this.sun.shadow.camera.left = -d
    this.sun.shadow.camera.right = d
    this.sun.shadow.camera.top = d
    this.sun.shadow.camera.bottom = -d
    this.sun.shadow.bias = 0.5
    this.sun.shadow.camera.near = 5
    this.sun.shadow.camera.far = 350
    this.sun.shadow.bias = -0.0001

    this.sunTarget = new Object3D()
    this.scene.add(this.sunTarget)
    this.sunTarget.position.copy(this.sceneCenter)
    this.sun.target = this.sunTarget
  }

  public updateDirectLights(phi: number, theta: number, radiusOffset = 0) {
    this.sunTarget.position.copy(this.sceneCenter)
    const spherical = new Spherical(this.sceneSphere.radius + radiusOffset, phi, theta)
    this.sun.position.setFromSpherical(spherical)
    this.sun.position.add(this.sunTarget.position)
    this.sun.updateWorldMatrix(true, true)
    this.sunTarget.updateMatrixWorld()
    this.sun.shadow.updateMatrices(this.sun)
    const box = this.sceneBox
    const low = box.min
    const high = box.max

    /** Get the 8 vertices of the world space bounding box */
    const corner1 = new Vector3(low.x, low.y, low.z)
    const corner2 = new Vector3(high.x, low.y, low.z)
    const corner3 = new Vector3(low.x, high.y, low.z)
    const corner4 = new Vector3(low.x, low.y, high.z)

    const corner5 = new Vector3(high.x, high.y, low.z)
    const corner6 = new Vector3(high.x, low.y, high.z)
    const corner7 = new Vector3(low.x, high.y, high.z)
    const corner8 = new Vector3(high.x, high.y, high.z)

    /** Transform them to light space */
    corner1.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner2.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner3.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner4.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner5.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner6.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner7.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    corner8.applyMatrix4(this.sun.shadow.camera.matrixWorldInverse)
    /** Compute the light space bounding box */
    const lightSpaceBox = new Box3().setFromPoints([
      corner1,
      corner2,
      corner3,
      corner4,
      corner5,
      corner6,
      corner7,
      corner8
    ])
    this.sun.shadow.camera.left = lightSpaceBox.min.x
    this.sun.shadow.camera.right = lightSpaceBox.max.x
    this.sun.shadow.camera.top = lightSpaceBox.min.y
    this.sun.shadow.camera.bottom = lightSpaceBox.max.y
    /** z is negative so smaller is actually 'larger' */
    this.sun.shadow.camera.near = Math.abs(lightSpaceBox.max.z)
    this.sun.shadow.camera.far = Math.abs(lightSpaceBox.min.z)
    this.sun.shadow.camera.updateProjectionMatrix()
    this.renderer.shadowMap.needsUpdate = true
  }

  public updateHelpers() {
    if (this.SHOW_HELPERS) {
      // ;(this.scene.getObjectByName('CamHelper') as CameraHelper).update()
      ;(this.scene.getObjectByName('SceneBoxHelper') as Box3Helper).box.copy(
        this.sceneBox
      )
    }
  }

  // NOTE: Alex, sorry for the stateful BS
  private selectionRawData: Record<string, unknown>[] = []

  private onObjectClick(e) {
    const result: Intersection = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e
    )

    if (!result) {
      this.selectionRawData = []
      this.viewer.emit('object-clicked', null)
      return
    }

    let multiSelect = false
    if (e.multiSelect) multiSelect = true

    const rv = this.batcher.getRenderView(
      result.object.uuid,
      result.faceIndex !== undefined ? result.faceIndex : result.index
    )

    /** Batch rejected picking. This only happens with hidden lines */
    if (!rv) {
      this.viewer.emit('object-clicked', !multiSelect ? null : { multiple: true })
      return
    }

    const hitId = rv.renderData.id
    const hitNode = WorldTree.getInstance().findId(hitId)

    let parentNode = hitNode
    while (!parentNode.model.atomic) {
      parentNode = parentNode.parent
    }

    if (multiSelect && !this.selectionRawData.includes(parentNode.model.raw))
      this.selectionRawData.push(parentNode.model.raw)
    else this.selectionRawData = [parentNode.model.raw]

    const selectionInfo = {
      userData: parentNode.model.raw,
      location: result.point,
      selectionCenter: result.point, // Ideally we'd get the selection center here
      multiple: multiSelect
    } as SelectionEvent

    this.viewer.emit('object-clicked', selectionInfo)
  }

  private onObjectDoubleClick(e) {
    const result: Intersection = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e
    )
    let rv = null
    if (!result) {
      if (this.viewer.sectionBox.display.visible) {
        this.zoomToBox(this.viewer.sectionBox.cube, 1.2, true)
      } else {
        this.zoomExtents()
      }
    } else {
      rv = this.batcher.getRenderView(
        result.object.uuid,
        result.faceIndex !== undefined ? result.faceIndex : result.index
      )
      if (rv) {
        const transformedBox = new Box3().copy(rv.aabb)
        transformedBox.applyMatrix4(result.object.matrixWorld)
        this.zoomToBox(transformedBox, 1.2, true)
        this.viewer.needsRender = true
        this.viewer.emit(
          'object-doubleclicked',
          result ? rv.renderData.id : null,
          result ? result.point : null
        )
      } else {
        if (this.viewer.sectionBox.display.visible) {
          this.zoomToBox(this.viewer.sectionBox.cube, 1.2, true)
        } else {
          this.zoomExtents()
        }
      }
    }
  }

  /** Taken from InteractionsHandler. Will revisit in the future */
  public zoomExtents(fit = 1.2, transition = true) {
    if (this.viewer.sectionBox.display.visible) {
      this.zoomToBox(this.viewer.sectionBox.cube.geometry.boundingBox, 1.2, true)
      return
    }
    if (this.allObjects.children.length === 0) {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      this.zoomToBox(box, fit, transition)
      return
    }

    const box = new Box3().setFromObject(this.allObjects)
    this.zoomToBox(box, fit, transition)
    // this.viewer.controls.setBoundary( box )
  }

  /** Taken from InteractionsHandler. Will revisit in the future */
  public zoomToBox(box, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }
    const fitOffset = fit

    const size = box.getSize(new Vector3())
    const target = new Sphere()
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

  public setView(origin: Vector3, target: Vector3, transition = true) {
    this.viewer.cameraHandler.activeCam.controls.setLookAt(
      origin.x,
      origin.y,
      origin.z,
      target.x,
      target.y,
      target.z,
      transition
    )
  }

  /**
   * Rotates camera to some canonical views
   * @param  {string}  side       Can be any of front, back, up (top), down (bottom), right, left.
   * @param  {Number}  fit        [description]
   * @param  {Boolean} transition [description]
   * @return {[type]}             [description]
   */
  public rotateTo(side: string, transition = true) {
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
        if (this.allObjects.children.length === 0)
          box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        else box = new Box3().setFromObject(this.allObjects)
        if (box.max.x === Infinity || box.max.x === -Infinity) {
          box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
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

  /** DEBUG */
  public onObjectClickDebug(e) {
    const result: Intersection = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e
    )
    if (!result) {
      this.batcher.resetBatchesDrawRanges()
      return
    }

    // console.warn(result)
    const rv = this.batcher.getRenderView(
      result.object.uuid,
      result.faceIndex !== undefined ? result.faceIndex : result.index
    )
    const hitId = rv.renderData.id

    const hitNode = WorldTree.getInstance().findId(hitId)
    // console.log(hitNode)

    this.batcher.resetBatchesDrawRanges()

    this.batcher.isolateRenderViewBatch(hitId)
  }

  public debugShowBatches() {
    this.batcher.resetBatchesDrawRanges()
    for (const k in this.batcher.batches) {
      this.batcher.batches[k].setDrawRanges({
        offset: 0,
        count: Infinity,
        material: this.batcher.materials.getDebugBatchMaterial(
          this.batcher.batches[k].getRenderView(0)
        )
      })
    }
  }
}
