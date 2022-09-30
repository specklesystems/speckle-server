import {
  ACESFilmicToneMapping,
  Box3,
  Box3Helper,
  Camera,
  CameraHelper,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  Group,
  Intersection,
  Matrix4,
  Mesh,
  Object3D,
  Plane,
  RGBADepthPacking,
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
import { Geometry } from './converter/Geometry'
import { SpeckleType } from './converter/GeometryConverter'
import { FilterMaterial } from './filtering/FilteringManager'
import Input, { InputOptionsDefault } from './input/Input'
import { Intersections } from './Intersections'
import SpeckleDepthMaterial from './materials/SpeckleDepthMaterial'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { NodeRenderView } from './tree/NodeRenderView'
import { Viewer } from './Viewer'
import { TreeNode, WorldTree } from './tree/WorldTree'
import {
  CanonicalView,
  DefaultLightConfiguration,
  InlineView,
  PolarView,
  SelectionEvent,
  SpeckleView,
  SunLightConfiguration,
  ViewerEvent
} from '../IViewer'
import { DefaultPipelineOptions, Pipeline, PipelineOptions } from './pipeline/Pipeline'

export default class SpeckleRenderer {
  private readonly SHOW_HELPERS = false
  private _renderer: WebGLRenderer
  public scene: Scene
  private rootGroup: Group
  private batcher: Batcher
  private intersections: Intersections
  private input: Input
  private sun: DirectionalLight
  private sunTarget: Object3D
  private sunConfiguration: SunLightConfiguration = DefaultLightConfiguration
  public viewer: Viewer // TEMPORARY
  private filterBatchRecording: string[]
  private pipeline: Pipeline

  public get renderer(): WebGLRenderer {
    return this._renderer
  }

  public set indirectIBL(texture: Texture) {
    this.scene.environment = texture
  }

  public set indirectIBLIntensity(value: number) {
    const batches = this.batcher.getBatches(undefined, GeometryType.MESH)
    for (let k = 0; k < batches.length; k++) {
      let material: SpeckleStandardMaterial | SpeckleStandardMaterial[] = (
        batches[k].renderObject as Mesh
      ).material as SpeckleStandardMaterial | SpeckleStandardMaterial[]
      material = Array.isArray(material) ? material : [material]
      for (let k = 0; k < material.length; k++) {
        material[k].envMapIntensity = value
      }
    }
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

  public get sunLight() {
    return this.sun
  }

  public set pipelineOptions(value: PipelineOptions) {
    this.pipeline.pipelineOptions = value
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

    this.pipeline = new Pipeline(this._renderer, this.batcher)
    this.pipeline.configure(this.scene, this.viewer.cameraHandler.activeCam.camera)
    this.pipeline.pipelineOptions = DefaultPipelineOptions

    this.input = new Input(this._renderer.domElement, InputOptionsDefault)
    this.input.on(ViewerEvent.ObjectClicked, this.onObjectClick.bind(this))
    this.input.on('object-clicked-debug', this.onObjectClickDebug.bind(this))
    this.input.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))

    this.addDirectLights()
    if (this.SHOW_HELPERS) {
      const helpers = new Group()
      helpers.name = 'Helpers'
      this.scene.add(helpers)

      const sceneBoxHelper = new Box3Helper(this.sceneBox, new Color(0x0000ff))
      sceneBoxHelper.name = 'SceneBoxHelper'
      helpers.add(sceneBoxHelper)

      const dirLightHelper = new DirectionalLightHelper(this.sun, 50, 0xff0000)
      dirLightHelper.name = 'DirLightHelper'
      helpers.add(dirLightHelper)

      const camHelper = new CameraHelper(this.sun.shadow.camera)
      camHelper.name = 'CamHelper'
      helpers.add(camHelper)
    }
  }

  public update(deltaTime: number) {
    this.batcher.update(deltaTime)
    const viewer = new Vector3()
    const viewerLow = new Vector3()
    const viewerHigh = new Vector3()

    viewer.set(
      this.sun.shadow.camera.matrixWorld.elements[12],
      this.sun.shadow.camera.matrixWorld.elements[13],
      this.sun.shadow.camera.matrixWorld.elements[14]
    )
    Geometry.DoubleToHighLowVector(viewer, viewerLow, viewerHigh)

    const rteView = new Matrix4()
    rteView.copy(this.sun.shadow.camera.matrixWorldInverse)
    rteView.elements[12] = 0
    rteView.elements[13] = 0
    rteView.elements[14] = 0

    const meshBatches = this.batcher.getBatches(undefined, GeometryType.MESH)
    for (let k = 0; k < meshBatches.length; k++) {
      const meshBatch: Mesh = meshBatches[k].renderObject as Mesh
      if (meshBatch.isMesh) {
        const rteModelView = new Matrix4()
        rteModelView.copy(rteView)
        rteModelView.multiply(meshBatch.matrixWorld)
        const depthMaterial: SpeckleDepthMaterial =
          meshBatch.customDepthMaterial as SpeckleDepthMaterial
        if (depthMaterial) {
          depthMaterial.userData.uViewer_low.value.copy(viewerLow)
          depthMaterial.userData.uViewer_high.value.copy(viewerHigh)
          depthMaterial.userData.rteModelViewMatrix.value.copy(rteModelView)
          depthMaterial.needsUpdate = true
        }

        const shadowMatrix = new Matrix4()
        shadowMatrix.set(
          0.5,
          0.0,
          0.0,
          0.5,
          0.0,
          0.5,
          0.0,
          0.5,
          0.0,
          0.0,
          0.5,
          0.5,
          0.0,
          0.0,
          0.0,
          1.0
        )

        shadowMatrix.multiply(this.sun.shadow.camera.projectionMatrix)
        shadowMatrix.multiply(rteView)
        let material: SpeckleStandardMaterial | SpeckleStandardMaterial[] =
          meshBatch.material as SpeckleStandardMaterial | SpeckleStandardMaterial[]
        material = Array.isArray(material) ? material : [material]
        for (let k = 0; k < material.length; k++) {
          if (material[k] instanceof SpeckleStandardMaterial) {
            material[k].userData.rteShadowMatrix.value.copy(shadowMatrix)
            material[k].userData.uShadowViewer_low.value.copy(viewerLow)
            material[k].userData.uShadowViewer_high.value.copy(viewerHigh)
            material[k].needsUpdate = true
          }
        }
      }
    }

    const v = new Vector3()
    const box = this.sceneBox
    const camPos = new Vector3().copy(
      this.viewer.cameraHandler.activeCam.camera.position
    )
    let d = 0
    v.set(box.min.x, box.min.y, box.min.z) // 000
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.min.y, box.max.z) // 001
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.max.y, box.min.z) // 010
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.max.y, box.max.z) // 011
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.min.y, box.min.z) // 100
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.min.y, box.max.z) // 101
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.max.y, box.min.z) // 110
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.max.y, box.max.z) // 111
    d = Math.max(camPos.distanceTo(v), d)
    this.viewer.cameraHandler.camera.far = d
    this.viewer.cameraHandler.activeCam.camera.far = d
    this.viewer.cameraHandler.activeCam.camera.updateProjectionMatrix()
    this.viewer.cameraHandler.camera.updateProjectionMatrix()
    this.pipeline.pipelineOptions = { saoParams: { saoScale: d } }
    // console.log(d)
  }

  public render(camera: Camera) {
    this.batcher.render(this.renderer)
    this.pipeline.render(this.scene, camera)
    // this.renderer.render(this.scene, camera)
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height)
    this.pipeline.resize(width, height)
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
      if (batch.geometryType === GeometryType.MESH) {
        const mesh = batchRenderable as unknown as Mesh
        const material = mesh.material as SpeckleStandardMaterial
        batchRenderable.castShadow = !material.transparent
        batchRenderable.receiveShadow = !material.transparent
        batchRenderable.customDepthMaterial = new SpeckleDepthMaterial(
          {
            depthPacking: RGBADepthPacking
          },
          ['USE_RTE', 'ALPHATEST_REJECTION']
        )
      }
    })

    this.updateDirectLights()
    this.updateHelpers()
  }

  public removeRenderTree(subtreeId: string) {
    this.rootGroup.remove(this.rootGroup.getObjectByName(subtreeId))
    this.batcher.purgeBatches(subtreeId)
    this.updateDirectLights()
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
    this.pipeline.updateClippingPlanes(planes)
    this.renderer.shadowMap.needsUpdate = true
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
    this.sun.shadow.camera.near = 5
    this.sun.shadow.camera.far = 350
    this.sun.shadow.bias = -0.001
    this.sun.shadow.radius = 2

    this.sunTarget = new Object3D()
    this.scene.add(this.sunTarget)
    this.sunTarget.position.copy(this.sceneCenter)
    this.sun.target = this.sunTarget
  }

  public updateDirectLights() {
    const phi = this.sunConfiguration.elevation
    const theta = this.sunConfiguration.azimuth
    const radiusOffset = this.sunConfiguration.radius
    this.sun.castShadow = this.sunConfiguration.castShadow
    this.sun.intensity = this.sunConfiguration.intensity
    this.sun.color = new Color(this.sunConfiguration.color)
    this.sun.visible = this.sunConfiguration.enabled

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
    this.viewer.needsRender = true
    this.updateHelpers()
  }

  public setSunLightConfiguration(config: SunLightConfiguration) {
    Object.assign(this.sunConfiguration, config)
    if (config.indirectLightIntensity) {
      this.indirectIBLIntensity = config.indirectLightIntensity
    }
    this.updateDirectLights()
  }

  public updateHelpers() {
    if (this.SHOW_HELPERS) {
      ;(this.scene.getObjectByName('CamHelper') as CameraHelper).update()
      // Thank you prettier, this looks so much better
      ;(this.scene.getObjectByName('SceneBoxHelper') as Box3Helper).box.copy(
        this.sceneBox
      )
      ;(this.scene.getObjectByName('DirLightHelper') as DirectionalLightHelper).update()
    }
  }

  private queryHits(
    results: Array<Intersection>
  ): Array<{ node: TreeNode; point: Vector3 }> {
    const rvs = []
    const points = []
    for (let k = 0; k < results.length; k++) {
      const rv = this.batcher.getRenderView(
        results[k].object.uuid,
        results[k].faceIndex !== undefined ? results[k].faceIndex : results[k].index
      )
      if (rv) {
        rvs.push(rv)
        points.push(results[k].point)
      }
    }

    /** Batch rejected picking. This only happens with hidden lines */
    if (rvs.length === 0) {
      return null
    }

    const queryResult = []
    for (let k = 0; k < rvs.length; k++) {
      const hitId = rvs[k].renderData.id
      const hitNode = WorldTree.getInstance().findId(hitId)
      let parentNode = hitNode
      while (!parentNode.model.atomic && parentNode.parent) {
        parentNode = parentNode.parent
      }
      queryResult.push({ node: parentNode, point: points[k] })
    }

    return queryResult
  }

  private onObjectClick(e) {
    const results: Array<Intersection> = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e,
      true,
      this.viewer.sectionBox.getCurrentBox()
    )

    if (!results) {
      this.viewer.emit(ViewerEvent.ObjectClicked, null)
      return
    }

    let multiSelect = false
    if (e.multiSelect) multiSelect = true

    const queryResults = this.queryHits(results)
    if (!queryResults) {
      this.viewer.emit(
        ViewerEvent.ObjectClicked,
        !multiSelect ? null : { multiple: true }
      )
      return
    }

    const selectionInfo = {
      multiple: multiSelect,
      hits: queryResults.map((value) => {
        return {
          guid: value.node.model.id,
          object: value.node.model.raw,
          point: value.point
        }
      })
    } as SelectionEvent
    this.viewer.emit(ViewerEvent.ObjectClicked, selectionInfo)
  }

  private onObjectDoubleClick(e) {
    const results: Array<Intersection> = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e,
      true,
      this.viewer.sectionBox.getCurrentBox()
    )
    if (!results) {
      this.viewer.emit(ViewerEvent.ObjectDoubleClicked, null)
      return
    }

    let multiSelect = false
    if (e.multiSelect) multiSelect = true

    const queryResults = this.queryHits(results)
    if (!queryResults) {
      this.viewer.emit(ViewerEvent.ObjectClicked, null)
      return
    }

    const selectionInfo = {
      multiple: multiSelect,
      hits: queryResults.map((value) => {
        return {
          guid: value.node.model.id,
          object: value.node.model.raw,
          point: value.point
        }
      })
    } as SelectionEvent

    this.viewer.emit(ViewerEvent.ObjectDoubleClicked, selectionInfo)
  }

  public boxFromObjects(objectIds: string[]) {
    let box = new Box3()
    const rvs: NodeRenderView[] = []
    if (objectIds.length > 0) {
      WorldTree.getInstance().walk((node: TreeNode) => {
        if (!node.model.atomic) return true
        if (!node.model.raw) return true
        if (objectIds.indexOf(node.model.raw.id) !== -1) {
          rvs.push(...WorldTree.getRenderTree().getRenderViewsForNode(node, node))
        }
        return true
      })
    } else box = this.sceneBox
    for (let k = 0; k < rvs.length; k++) {
      let rvBox = null
      if ((rvBox = rvs[k].aabb) !== null) {
        box.union(rvBox)
      }
    }
    if (box.getSize(new Vector3()).length() === 0) {
      console.error(`object selection resulted in empty box`)
    }
    return box
  }
  public zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    if (!objectIds) {
      this.zoomExtents(fit, transition)
      return
    }
    this.zoomToBox(this.boxFromObjects(objectIds), fit, transition)
  }

  /** Taken from InteractionsHandler. Will revisit in the future */
  private zoomExtents(fit = 1.2, transition = true) {
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
    // this.viewer.cameraHandler.camera.near = distance / 100
    // this.viewer.cameraHandler.camera.far = distance * 100
    // this.viewer.cameraHandler.camera.updateProjectionMatrix()

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

  private isSpeckleView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is SpeckleView {
    return (view as SpeckleView).name !== undefined
  }

  private isCanonicalView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is CanonicalView {
    return typeof (view as CanonicalView) === 'string'
  }

  private isInlineView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is InlineView {
    return (
      (view as InlineView).position !== undefined &&
      (view as InlineView).target !== undefined
    )
  }

  private isPolarView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is PolarView {
    return (
      (view as PolarView).azimuth !== undefined &&
      (view as PolarView).polar !== undefined
    )
  }

  public setView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition = true
  ): void {
    if (this.isSpeckleView(view)) {
      this.setViewSpeckle(view, transition)
    }
    if (this.isCanonicalView(view)) {
      this.setViewCanonical(view, transition)
    }
    if (this.isInlineView(view)) {
      this.setViewInline(view, transition)
    }
    if (this.isPolarView(view)) {
      this.setViewPolar(view, transition)
    }
  }

  private setViewSpeckle(view: SpeckleView, transition = true) {
    this.viewer.cameraHandler.activeCam.controls.setLookAt(
      view.view.origin['x'],
      view.view.origin['y'],
      view.view.origin['z'],
      view.view.target['x'],
      view.view.target['y'],
      view.view.target['z'],
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
  private setViewCanonical(side: string, transition = true) {
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

  private setViewInline(view: InlineView, transition = true) {
    this.viewer.cameraHandler.activeCam.controls.setLookAt(
      view.position.x,
      view.position.y,
      view.position.z,
      view.target.x,
      view.target.y,
      view.target.z,
      transition
    )
  }

  private setViewPolar(view: PolarView, transition = true) {
    this.viewer.cameraHandler.controls.rotate(view.azimuth, view.polar, transition)
  }

  /** DEBUG */
  public onObjectClickDebug(e) {
    const results: Array<Intersection> = this.intersections.intersect(
      this.scene,
      this.viewer.cameraHandler.activeCam.camera,
      e,
      true,
      this.viewer.sectionBox.getCurrentBox()
    )
    if (!results) {
      this.batcher.resetBatchesDrawRanges()
      return
    }
    const result = results[0]
    // console.warn(result)
    const rv = this.batcher.getRenderView(
      result.object.uuid,
      result.faceIndex !== undefined ? result.faceIndex : result.index
    )
    const hitId = rv.renderData.id

    // const hitNode = WorldTree.getInstance().findId(hitId)
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
