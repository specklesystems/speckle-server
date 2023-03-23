import {
  ACESFilmicToneMapping,
  Box3,
  Box3Helper,
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
import { SpeckleTypeAllRenderables } from './converter/GeometryConverter'
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
import {
  DefaultPipelineOptions,
  Pipeline,
  PipelineOptions,
  RenderType
} from './pipeline/Pipeline'
import { MeshBVHVisualizer } from 'three-mesh-bvh'
import MeshBatch from './batching/MeshBatch'
import { PlaneId, SectionBoxOutlines } from './SectionBoxOutlines'
import { Shadowcatcher } from './Shadowcatcher'
import Logger from 'js-logger'

export enum ObjectLayers {
  STREAM_CONTENT_MESH = 10,
  STREAM_CONTENT_LINE = 11,
  STREAM_CONTENT_POINT = 12,

  STREAM_CONTENT = 1,
  PROPS = 2,
  SHADOWCATCHER = 3
}

export default class SpeckleRenderer {
  private readonly SHOW_HELPERS = false
  public SHOW_BVH = false
  private container: HTMLElement
  private _renderer: WebGLRenderer
  public _scene: Scene
  private _needsRender: boolean
  private rootGroup: Group
  private batcher: Batcher
  private _intersections: Intersections
  private input: Input
  private sun: DirectionalLight
  private sunTarget: Object3D
  private sunConfiguration: SunLightConfiguration = DefaultLightConfiguration
  public viewer: Viewer // TEMPORARY
  private filterBatchRecording: string[]
  private pipeline: Pipeline
  private lastSectionPlanes: Plane[] = []
  private sectionPlanesChanged: Plane[] = []
  private sectionBoxOutlines: SectionBoxOutlines = null
  private _shadowcatcher: Shadowcatcher = null
  private cancel: { [subtreeId: string]: boolean } = {}

  public get renderer(): WebGLRenderer {
    return this._renderer
  }

  public set needsRender(value: boolean) {
    this._needsRender ||= value
  }

  public set indirectIBL(texture: Texture) {
    this._scene.environment = texture
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
    return this._scene.getObjectByName('ContentGroup')
  }

  public subtree(subtreeId: string) {
    return this._scene.getObjectByName(subtreeId)
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

  public get camera() {
    return this.viewer.cameraHandler.activeCam.camera
  }

  public get scene() {
    return this._scene
  }

  public set pipelineOptions(value: PipelineOptions) {
    this.pipeline.pipelineOptions = value
  }

  public set showBVH(value: boolean) {
    this.SHOW_BVH = value
    this.allObjects.traverse((obj) => {
      if (obj.name.includes('_bvh')) {
        obj.visible = this.SHOW_BVH
      }
    })
  }

  public get shadowcatcher() {
    return this._shadowcatcher
  }

  public get intersections() {
    return this._intersections
  }

  public get currentSectionBox() {
    return this.viewer.sectionBox.getCurrentBox()
  }

  public constructor(viewer: Viewer /** TEMPORARY */) {
    this._scene = new Scene()
    this.rootGroup = new Group()
    this.rootGroup.name = 'ContentGroup'
    this.rootGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this._scene.add(this.rootGroup)

    this.batcher = new Batcher()
    this._intersections = new Intersections()
    this.viewer = viewer
    this.lastSectionPlanes.push(
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane()
    )
  }

  public create(container: HTMLElement) {
    this._renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      stencil: true
    })
    this._renderer.setClearColor(0xffffff, 0)
    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.outputEncoding = sRGBEncoding
    this._renderer.toneMapping = ACESFilmicToneMapping
    this._renderer.toneMappingExposure = 0.5
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = VSMShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.shadowMap.needsUpdate = true
    this.renderer.physicallyCorrectLights = true
    this.renderer.autoClearStencil = false

    this.container = container
    this._renderer.setSize(container.offsetWidth, container.offsetHeight)
    container.appendChild(this._renderer.domElement)

    this.pipeline = new Pipeline(this._renderer, this.batcher)
    this.pipeline.configure()
    this.pipeline.pipelineOptions = DefaultPipelineOptions

    this.sectionBoxOutlines = new SectionBoxOutlines()
    const sectionBoxCapperGroup = new Group()
    sectionBoxCapperGroup.name = 'SectionBoxOutlines'
    this.scene.add(sectionBoxCapperGroup)
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.NEGATIVE_Z).renderable
    )
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.POSITIVE_Z).renderable
    )
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.POSITIVE_X).renderable
    )
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.NEGATIVE_X).renderable
    )
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.POSITIVE_Y).renderable
    )
    sectionBoxCapperGroup.add(
      this.sectionBoxOutlines.getPlaneOutline(PlaneId.NEGATIVE_Y).renderable
    )

    this.input = new Input(this._renderer.domElement, InputOptionsDefault)
    this.input.on(ViewerEvent.ObjectClicked, this.onObjectClick.bind(this))
    // this.input.on('object-clicked-debug', this.onObjectClickDebug.bind(this))
    this.input.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))

    this.addDirectLights()
    if (this.SHOW_HELPERS) {
      const helpers = new Group()
      helpers.name = 'Helpers'
      this._scene.add(helpers)

      const sceneBoxHelper = new Box3Helper(this.sceneBox, new Color(0x0000ff))
      sceneBoxHelper.name = 'SceneBoxHelper'
      sceneBoxHelper.layers.set(ObjectLayers.PROPS)
      helpers.add(sceneBoxHelper)

      const dirLightHelper = new DirectionalLightHelper(this.sun, 50, 0xff0000)
      dirLightHelper.name = 'DirLightHelper'
      dirLightHelper.layers.set(ObjectLayers.PROPS)
      helpers.add(dirLightHelper)

      const camHelper = new CameraHelper(this.sun.shadow.camera)
      camHelper.name = 'CamHelper'
      camHelper.layers.set(ObjectLayers.PROPS)
      helpers.add(camHelper)
    }

    this.viewer.cameraHandler.controls.restThreshold = 0.001
    this.viewer.cameraHandler.controls.addEventListener('rest', () => {
      this._needsRender = true
      this.pipeline.onStationaryBegin()
    })
    this.viewer.cameraHandler.controls.addEventListener('controlstart', () => {
      this._needsRender = true
      this.pipeline.onStationaryEnd()
    })

    this.viewer.cameraHandler.controls.addEventListener('controlend', () => {
      this._needsRender = true
      if (this.viewer.cameraHandler.controls.hasRested)
        this.pipeline.onStationaryBegin()
    })

    this.viewer.cameraHandler.controls.addEventListener('control', () => {
      this._needsRender = true
      this.pipeline.onStationaryEnd()
    })
    this.viewer.cameraHandler.controls.addEventListener('update', () => {
      if (
        !this.viewer.cameraHandler.controls.hasRested &&
        this.pipeline.renderType === RenderType.ACCUMULATION
      ) {
        this._needsRender = true
        this.pipeline.onStationaryEnd()
      }
    })

    this._shadowcatcher = new Shadowcatcher(ObjectLayers.SHADOWCATCHER, [
      ObjectLayers.STREAM_CONTENT_MESH
      // ObjectLayers.STREAM_CONTENT_LINE
    ])
    let restoreVisibility
    this._shadowcatcher.shadowcatcherPass.onBeforeRender = () => {
      restoreVisibility = this.batcher.saveVisiblity()
      const opaque = this.batcher.getOpaque()
      this.batcher.applyVisibility(opaque)
    }
    this._shadowcatcher.shadowcatcherPass.onAfterRender = () => {
      this.batcher.applyVisibility(restoreVisibility)
    }

    this._scene.add(this._shadowcatcher.shadowcatcherMesh)
  }

  public update(deltaTime: number) {
    this.needsRender = this.viewer.cameraHandler.controls.update(deltaTime)

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
    this.viewer.cameraHandler.activeCam.camera.far = d * 2
    this.viewer.cameraHandler.activeCam.camera.updateProjectionMatrix()
    this.viewer.cameraHandler.camera.updateProjectionMatrix()

    this.pipeline.update(this)
    if (this.sunConfiguration.shadowcatcher) {
      this._shadowcatcher.update(this._scene)
    }
  }

  public resetPipeline(force = false) {
    this._needsRender = true
    if (this.viewer.cameraHandler.controls.hasRested || force) this.pipeline.reset()
  }

  public render(): void {
    if (this._needsRender) {
      this.batcher.render(this.renderer)
      this._needsRender = this.pipeline.render()
      // this.renderer.render(this.scene, this.viewer.cameraHandler.activeCam.camera)
      // this._needsRender = true
      if (this.sunConfiguration.shadowcatcher) {
        this._shadowcatcher.render(this._renderer)
      }
    }
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height)
    this.pipeline.resize(width, height)
    this._needsRender = true
  }

  public addRenderTree(subtreeId: string) {
    this.batcher.makeBatches(subtreeId, SpeckleTypeAllRenderables)
    const subtreeGroup = new Group()
    subtreeGroup.name = subtreeId
    subtreeGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this.rootGroup.add(subtreeGroup)

    const batches = this.batcher.getBatches(subtreeId)
    batches.forEach((batch: Batch) => {
      this.addBatch(batch, subtreeGroup)
    })

    this.updateDirectLights()
    this.updateHelpers()
    if (this.viewer.sectionBox.display.visible) {
      this.viewer.setSectionBox()
    }
    this.updateShadowCatcher()
    this._needsRender = true
  }

  public async addRenderTreeAsync(subtreeId: string, priority = 1) {
    this.cancel[subtreeId] = false
    const subtreeGroup = new Group()
    subtreeGroup.name = subtreeId
    subtreeGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this.rootGroup.add(subtreeGroup)

    const generator = this.batcher.makeBatchesAsync(
      subtreeId,
      SpeckleTypeAllRenderables,
      undefined,
      priority
    )
    for await (const batch of generator) {
      this.addBatch(batch, subtreeGroup)
      this.zoom()
      if (batch.geometryType === GeometryType.MESH) {
        this.updateDirectLights()
        this.updateShadowCatcher()
      }
      this._needsRender = true
      if (this.cancel[subtreeId]) {
        generator.return()
        this.removeRenderTree(subtreeId)
        delete this.cancel[subtreeId]
        break
      }
    }
    this.updateHelpers()
    if (this.viewer.sectionBox.display.visible) {
      this.viewer.setSectionBox()
    }
    delete this.cancel[subtreeId]
  }

  private addBatch(batch: Batch, parent: Object3D) {
    const batchRenderable = batch.renderObject
    parent.add(batch.renderObject)

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
      if (this.SHOW_BVH) {
        const bvhHelper: MeshBVHVisualizer = new MeshBVHVisualizer(
          batchRenderable as Mesh,
          10
        )
        bvhHelper.name = batch.renderObject.id + '_bvh'
        bvhHelper.traverse((obj) => {
          obj.layers.set(ObjectLayers.PROPS)
        })
        bvhHelper.displayParents = true
        bvhHelper.visible = false
        bvhHelper.update()
        parent.add(bvhHelper)
      }
    }
  }

  public removeRenderTree(subtreeId: string) {
    this.rootGroup.remove(this.rootGroup.getObjectByName(subtreeId))
    this.updateShadowCatcher()

    this.batcher.purgeBatches(subtreeId)
    this.updateDirectLights()
    this.updateHelpers()
  }

  public cancelRenderTree(subtreeId: string) {
    if (this.cancel[subtreeId] !== undefined) {
      this.cancel[subtreeId] = true
    }
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
    this.updateClippingPlanes(this.viewer.sectionBox.planes)
    if (this.viewer.sectionBox.display.visible) {
      this.updateSectionBoxCapper()
    }
    this.renderer.shadowMap.needsUpdate = true
    this.updateShadowCatcher()
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
    this.sectionBoxOutlines.updateClippingPlanes(planes)
    this._shadowcatcher.updateClippingPlanes(planes)
    this.renderer.shadowMap.needsUpdate = true
    this.resetPipeline()
    // console.log('Updated planes -> ', this.viewer.sectionBox.planes[2])
  }

  private setSectionPlaneChanged(planes: Plane[]) {
    this.sectionPlanesChanged.length = 0
    for (let k = 0; k < planes.length; k++) {
      if (Math.abs(this.lastSectionPlanes[k].constant - planes[k].constant) > 0.0001)
        this.sectionPlanesChanged.push(planes[k])
      this.lastSectionPlanes[k].copy(planes[k])
    }
  }

  public onSectionBoxDragStart() {
    this.sectionBoxOutlines.enable(false)
  }

  public onSectionBoxDragEnd() {
    const generate = () => {
      this.setSectionPlaneChanged(this.viewer.sectionBox.planes)
      this.updateSectionBoxCapper(this.sectionPlanesChanged)
      this.updateShadowCatcher()
      this.viewer.removeListener(ViewerEvent.SectionBoxUpdated, generate)
    }
    this.viewer.on(ViewerEvent.SectionBoxUpdated, generate)
  }

  public updateSectionBoxCapper(planes?: Plane[]) {
    const start = performance.now()
    if (!planes) planes = this.viewer.sectionBox.planes
    for (let k = 0; k < planes.length; k++) {
      this.sectionBoxOutlines.updatePlaneOutline(
        this.batcher.getBatches(undefined, GeometryType.MESH) as MeshBatch[],
        planes[k]
      )
    }
    this.sectionBoxOutlines.enable(this.viewer.sectionBox.display.visible)
    Logger.warn('Outline time: ', performance.now() - start)
  }

  public enableSectionBoxCapper(value: boolean) {
    this.sectionBoxOutlines.enable(value)
  }

  public updateShadowCatcher() {
    this._shadowcatcher.shadowcatcherMesh.visible = this.sunConfiguration.shadowcatcher
    if (this.sunConfiguration.shadowcatcher) {
      this._shadowcatcher.bake(
        this.sceneBox,
        this._renderer.capabilities.maxTextureSize
      )
      this.resetPipeline()
    }
  }

  private addDirectLights() {
    this.sun = new DirectionalLight(0xffffff, 5)
    this.sun.name = 'sun'
    this.sun.layers.set(ObjectLayers.STREAM_CONTENT)
    this._scene.add(this.sun)

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
    this._scene.add(this.sunTarget)
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
    this.needsRender = true
    this.updateHelpers()
    this.resetPipeline()
  }

  public setSunLightConfiguration(config: SunLightConfiguration) {
    Object.assign(this.sunConfiguration, config)
    if (config.indirectLightIntensity !== undefined) {
      this.indirectIBLIntensity = config.indirectLightIntensity
    }
    this.updateDirectLights()
    this.updateShadowCatcher()
  }

  public updateHelpers() {
    if (this.SHOW_HELPERS) {
      ;(this._scene.getObjectByName('CamHelper') as CameraHelper).update()
      // Thank you prettier, this looks so much better
      ;(this._scene.getObjectByName('SceneBoxHelper') as Box3Helper).box.copy(
        this.sceneBox
      )
      ;(
        this._scene.getObjectByName('DirLightHelper') as DirectionalLightHelper
      ).update()
    }
  }

  public queryHits(
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

  public queryHitIds(
    results: Array<Intersection>
  ): Array<{ nodeId: string; point: Vector3 }> {
    const queryResult = []
    for (let k = 0; k < results.length; k++) {
      const rv = this.batcher.getRenderView(
        results[k].object.uuid,
        results[k].faceIndex !== undefined ? results[k].faceIndex : results[k].index
      )
      if (rv) {
        queryResult.push({ nodeId: rv.renderData.id, point: results[k].point })
      }
    }

    /** Batch rejected picking. This only happens with hidden lines */
    if (queryResult.length === 0) {
      return null
    }

    return queryResult
  }

  private onObjectClick(e) {
    const results: Array<Intersection> = this._intersections.intersect(
      this._scene,
      this.viewer.cameraHandler.activeCam.camera,
      e,
      true,
      this.viewer.sectionBox.getCurrentBox()
    )

    if (!results) {
      this.viewer.emit(ViewerEvent.ObjectClicked, null)
      if (this.SHOW_BVH) {
        this.allObjects.traverse((obj) => {
          if (obj.name.includes('_bvh')) {
            obj.visible = true
          }
        })
      }
      return
    }

    let multiSelect = false
    if (e.multiSelect) multiSelect = true

    const queryResults = this.queryHits(results)
    if (!queryResults) {
      this.viewer.emit(
        ViewerEvent.ObjectClicked,
        !multiSelect ? null : { multiple: true, event: e.event }
      )
      return
    }

    const selectionInfo = {
      multiple: multiSelect,
      event: e.event,
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
    const results: Array<Intersection> = this._intersections.intersect(
      this._scene,
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
      this.pipeline.onStationaryEnd()
      return
    }
    this.zoomToBox(this.boxFromObjects(objectIds), fit, transition)
    this.pipeline.onStationaryEnd()
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
    this.viewer.cameraHandler.camera.near = Math.max(distance / 100, 0.1)
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
    this.pipeline.onStationaryEnd()
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

  public screenToNDC(
    clientX: number,
    clientY: number,
    width?: number,
    height?: number
  ) {
    // Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
    const canvas: HTMLCanvasElement = this._renderer.domElement
    const rect = this.container.getBoundingClientRect()

    const pos = {
      x:
        width === undefined
          ? ((clientX - rect.left) * canvas.width) / rect.width
          : clientX,
      y:
        height === undefined
          ? ((clientY - rect.top) * canvas.height) / rect.height
          : clientY
    }
    return {
      x: (pos.x / (width === undefined ? canvas.width : width)) * 2 - 1,
      y: (pos.y / (height === undefined ? canvas.height : height)) * -2 + 1
    }
  }

  public NDCToScreen(
    clientX: number,
    clientY: number,
    width?: number,
    height?: number
  ) {
    const canvas: HTMLCanvasElement = this._renderer.domElement
    width = width !== undefined ? width : canvas.width
    height = height !== undefined ? height : canvas.height
    return {
      x: (clientX * 0.5 + 0.5) * width,
      y: (clientY * -0.5 + 0.5) * height
    }
  }

  /** DEBUG */
  public onObjectClickDebug(e) {
    const results: Array<Intersection> = this._intersections.intersect(
      this._scene,
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
    if (this.SHOW_BVH) {
      this.allObjects.traverse((obj) => {
        if (obj.name.includes('_bvh')) {
          obj.visible = false
        }
      })
      this.scene.getObjectByName(result.object.id + '_bvh').visible = true
    }
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
