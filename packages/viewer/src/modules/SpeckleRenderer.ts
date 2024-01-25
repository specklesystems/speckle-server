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
  Material,
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
  VSMShadowMap
} from 'three'
import { Batch, GeometryType } from './batching/Batch'
import Batcher from './batching/Batcher'
import { Geometry } from './converter/Geometry'
import Input, { InputEvent, InputOptionsDefault } from './input/Input'
import { Intersections } from './Intersections'
import SpeckleDepthMaterial from './materials/SpeckleDepthMaterial'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { NodeRenderView } from './tree/NodeRenderView'
import { Viewer } from './Viewer'
import { TreeNode } from './tree/WorldTree'
import {
  DefaultLightConfiguration,
  ObjectLayers,
  SelectionEvent,
  SunLightConfiguration,
  ViewerEvent
} from '../IViewer'
import { DefaultPipelineOptions, Pipeline, PipelineOptions } from './pipeline/Pipeline'
import MeshBatch from './batching/MeshBatch'
import { Shadowcatcher } from './Shadowcatcher'
import SpeckleMesh from './objects/SpeckleMesh'
import { ExtendedIntersection } from './objects/SpeckleRaycaster'
import { BatchObject } from './batching/BatchObject'
import {
  ICameraProvider,
  CameraControllerEvent
} from './extensions/core-extensions/Providers'
import Materials, {
  RenderMaterial,
  DisplayStyle,
  MaterialOptions,
  FilterMaterial
} from './materials/Materials'
import { SpeckleMaterial } from './materials/SpeckleMaterial'
import { SpeckleWebGLRenderer } from './objects/SpeckleWebGLRenderer'
import { SpeckleTypeAllRenderables } from './loaders/GeometryConverter'
import SpeckleInstancedMesh from './objects/SpeckleInstancedMesh'
import { BaseSpecklePass } from './pipeline/SpecklePass'

export class RenderingStats {
  private renderTimeAcc = 0
  private renderTimeSamples = 0
  private readonly renderTimeMaxSamples = 500
  private renderTimeStart = 0
  public renderTime = 0

  public objects: number
  public batchCount: number
  public drawCalls: number
  public trisCount: number
  public vertCount: number

  public batchDetails: Array<{
    drawCalls: number
    minDrawCalls: number
    tris: number
    verts: number
  }>

  public frameStart() {
    this.renderTimeStart = performance.now()
  }
  public frameEnd() {
    this.renderTimeAcc += performance.now() - this.renderTimeStart
    this.renderTimeSamples++
    if (this.renderTimeSamples % this.renderTimeMaxSamples === 0) {
      this.renderTime = this.renderTimeAcc / this.renderTimeSamples
      this.renderTimeSamples = 0
      this.renderTimeAcc = 0
      // Logger.log(this.renderTime)
    }
  }
}

export default class SpeckleRenderer {
  private readonly SHOW_HELPERS = false
  private readonly IGNORE_ZERO_OPACITY_OBJECTS = true
  public SHOW_BVH = false
  private container: HTMLElement
  private _renderer: SpeckleWebGLRenderer
  private _renderinStats: RenderingStats
  public _scene: Scene
  private _needsRender: boolean
  private rootGroup: Group
  public batcher: Batcher
  private _intersections: Intersections
  public input: Input
  private sun: DirectionalLight
  private sunConfiguration: SunLightConfiguration = DefaultLightConfiguration
  private sunTarget: Object3D
  public viewer: Viewer // TEMPORARY
  public pipeline: Pipeline

  private _shadowcatcher: Shadowcatcher = null
  private cancel: { [subtreeId: string]: boolean } = {}

  private _cameraProvider: ICameraProvider = null
  private _clippingPlanes: Plane[] = []
  private _clippingVolume: Box3 = new Box3()

  private _renderOverride: () => void = null

  /********************************
   * Renderer and rendering flags */
  public get renderer(): SpeckleWebGLRenderer {
    return this._renderer
  }

  public set needsRender(value: boolean) {
    this._needsRender ||= value
  }

  public set shadowMapNeedsUpdate(value: boolean) {
    this._renderer.shadowMap.needsUpdate = value
  }

  /**********************
   * Bounds and volumes */
  public get sceneBox() {
    const bounds: Box3 = new Box3()
    const batches = this.batcher.getBatches()
    for (let k = 0; k < batches.length; k++) {
      bounds.union(batches[k].bounds)
    }
    return bounds
  }

  public get sceneSphere() {
    return this.sceneBox.getBoundingSphere(new Sphere())
  }

  public get sceneCenter() {
    return this.sceneBox.getCenter(new Vector3())
  }

  public get clippingVolume(): Box3 {
    return !this._clippingVolume.isEmpty()
      ? new Box3().copy(this._clippingVolume)
      : this.sceneBox
  }

  public set clippingVolume(box: Box3) {
    this._clippingVolume = this.sceneBox.intersect(box)
  }

  /*****************
   * Clipping planes */
  public get clippingPlanes(): Plane[] {
    return this._clippingPlanes
  }

  public set clippingPlanes(value: Plane[]) {
    this._clippingPlanes = value.map((value: Plane) => new Plane().copy(value))
    this.updateClippingPlanes()
  }

  /****************
   * Common Objects */
  public get allObjects() {
    return this._scene.getObjectByName('ContentGroup')
  }

  public subtree(subtreeId: string) {
    return this._scene.getObjectByName(subtreeId)
  }

  public get scene() {
    return this._scene
  }

  /********
   * Lights */

  public get sunLight() {
    return this.sun
  }

  public set indirectIBL(texture: Texture) {
    this._scene.environment = texture
  }

  public set indirectIBLIntensity(value: number) {
    /** Update envMap intensity for mesh geometry types only */
    const batches = this.batcher.getBatches(undefined, GeometryType.MESH)
    for (let k = 0; k < batches.length; k++) {
      const materials: SpeckleStandardMaterial[] = batches[k]
        .materials as SpeckleStandardMaterial[]
      for (let k = 0; k < materials.length; k++) {
        materials[k].envMapIntensity = value
      }
    }
  }

  /********
   * Camera */
  public get cameraProvider() {
    return this._cameraProvider
  }

  public set cameraProvider(value: ICameraProvider) {
    this._cameraProvider = value
    this._cameraProvider.on(CameraControllerEvent.Dynamic, () => {
      this._needsRender = true
      this.pipeline.onStationaryEnd()
    })
    this._cameraProvider.on(CameraControllerEvent.Stationary, () => {
      this._needsRender = true
      this.pipeline.onStationaryBegin()
    })
    this._cameraProvider.on(CameraControllerEvent.FrameUpdate, (data: boolean) => {
      this.needsRender = data
      if (this.pipeline.needsAccumulation && data) {
        this.pipeline.reset()
      }
    })
  }

  public get renderingCamera() {
    return this._cameraProvider.renderingCamera
  }

  /**********
   * Pipeline */
  public set pipelineOptions(value: PipelineOptions) {
    this.pipeline.pipelineOptions = value
  }

  public get pipelineOptions() {
    return this.pipeline.pipelineOptions
  }

  public get shadowcatcher() {
    return this._shadowcatcher
  }

  /**************
   * Intersections */
  public get intersections() {
    return this._intersections
  }

  /*****************
   * Rendering Stats */
  public get renderingStats(): RenderingStats {
    const batches = Object.values(this.batcher.batches)

    this._renderinStats.objects = batches.reduce(
      (a: number, c: Batch) => a + c.renderViews.length,
      0
    )
    this._renderinStats.batchCount = batches.length
    ;(this._renderinStats.drawCalls = batches.reduce(
      (a: number, c: Batch) => a + c.drawCalls,
      0
    )),
      (this._renderinStats.trisCount = batches.reduce(
        (a: number, c: Batch) => a + c.triCount,
        0
      )),
      (this._renderinStats.vertCount = batches.reduce(
        (a: number, c: Batch) => a + c.vertCount,
        0
      )),
      (this._renderinStats.batchDetails = batches.map((batch: Batch) => {
        return {
          type: batch.constructor.name,
          objCount: batch.renderViews.length,
          drawCalls: batch.drawCalls,
          minDrawCalls: batch.minDrawCalls,
          tris: batch.triCount,
          verts: batch.vertCount
        }
      }))
    return this._renderinStats
  }

  public constructor(viewer: Viewer /** TEMPORARY */) {
    this._renderinStats = new RenderingStats()
    this._scene = new Scene()
    this.rootGroup = new Group()
    this.rootGroup.name = 'ContentGroup'
    this.rootGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this._scene.add(this.rootGroup)

    this._intersections = new Intersections()
    this.viewer = viewer
  }

  public create(container: HTMLElement) {
    this._renderer = new SpeckleWebGLRenderer({
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
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type = VSMShadowMap
    this._renderer.shadowMap.autoUpdate = false
    this._renderer.shadowMap.needsUpdate = true
    this._renderer.physicallyCorrectLights = true
    this._renderer.autoClearStencil = false

    this.container = container
    this._renderer.setSize(container.offsetWidth, container.offsetHeight)
    container.appendChild(this._renderer.domElement)

    this.batcher = new Batcher(
      this.renderer.capabilities.maxVertexUniforms,
      this.renderer.capabilities.floatVertexTextures
    )

    this.pipeline = new Pipeline(this._renderer, this.batcher)
    this.pipeline.configure()
    this.pipeline.pipelineOptions = DefaultPipelineOptions

    this.input = new Input(this._renderer.domElement, InputOptionsDefault)
    this.input.on(InputEvent.Click, this.onClick.bind(this))
    this.input.on(InputEvent.DoubleClick, this.onDoubleClick.bind(this))

    this.addDirectLights()
    if (this.SHOW_HELPERS) {
      const helpers = new Group()
      helpers.name = 'Helpers'
      this._scene.add(helpers)

      const sceneBoxHelper = new Box3Helper(this.clippingVolume, new Color(0xff00ff))
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

    this._shadowcatcher = new Shadowcatcher(ObjectLayers.SHADOWCATCHER, [
      ObjectLayers.STREAM_CONTENT_MESH
      // ObjectLayers.STREAM_CONTENT_LINE
    ])
    let restoreVisibility, opaque
    this._shadowcatcher.shadowcatcherPass.onBeforeRender = () => {
      restoreVisibility = this.batcher.saveVisiblity()
      opaque = this.batcher.getOpaque()
      this.batcher.applyVisibility(opaque)
      this.batcher.overrideMaterial(
        opaque,
        this._shadowcatcher.shadowcatcherPass.drawDepthMaterial
      )
    }
    this._shadowcatcher.shadowcatcherPass.onAfterRender = () => {
      this.batcher.applyVisibility(restoreVisibility)
      this.batcher.restoreMaterial(opaque)
    }

    this._scene.add(this._shadowcatcher.shadowcatcherMesh)
  }

  public update(deltaTime: number) {
    if (!this._cameraProvider) return
    this.batcher.update(deltaTime)

    this.renderingCamera.updateMatrixWorld(true)
    this._renderer.updateRTEViewModel(this.renderingCamera)
    this.updateRTEShadows()

    this.updateTransforms()
    this.updateFrustum()

    this.pipeline.update(this)

    if (this.sunConfiguration.shadowcatcher) {
      this._shadowcatcher.update(this._scene)
    }
  }

  private updateRTEShadowBuffers(): boolean {
    if (!this._renderer.shadowMap.needsUpdate) return false

    this._renderer.RTEBuffers.shadowViewer.set(
      this.sun.shadow.camera.matrixWorld.elements[12],
      this.sun.shadow.camera.matrixWorld.elements[13],
      this.sun.shadow.camera.matrixWorld.elements[14]
    )
    Geometry.DoubleToHighLowVector(
      this._renderer.RTEBuffers.shadowViewer,
      this._renderer.RTEBuffers.shadowViewerLow,
      this._renderer.RTEBuffers.shadowViewerHigh
    )

    this._renderer.RTEBuffers.rteShadowViewModelMatrix.copy(
      this.sun.shadow.camera.matrixWorldInverse
    )
    this._renderer.RTEBuffers.rteShadowViewModelMatrix.elements[12] = 0
    this._renderer.RTEBuffers.rteShadowViewModelMatrix.elements[13] = 0
    this._renderer.RTEBuffers.rteShadowViewModelMatrix.elements[14] = 0

    // Lovely
    this._renderer.RTEBuffers.rteShadowMatrix.set(
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

    this._renderer.RTEBuffers.rteShadowMatrix.multiply(
      this.sun.shadow.camera.projectionMatrix
    )
    this._renderer.RTEBuffers.rteShadowMatrix.multiply(
      this._renderer.RTEBuffers.rteShadowViewModelMatrix
    )
    return true
  }

  private updateRTEShadows() {
    if (!this.updateRTEShadowBuffers()) return

    const meshBatches = this.batcher.getBatches(
      undefined,
      GeometryType.MESH
    ) as MeshBatch[]
    for (let k = 0; k < meshBatches.length; k++) {
      const speckleMesh: SpeckleMesh | SpeckleInstancedMesh = meshBatches[k]
        .renderObject as SpeckleMesh | SpeckleInstancedMesh

      /** Shadowmap depth material does not go thorugh the normal flow.
       * It's onBeforeRender is not getting called That's why we're updating
       * the RTE related uniforms manually here
       */
      speckleMesh.traverse((obj: Object3D) => {
        const depthMaterial: SpeckleDepthMaterial =
          obj.customDepthMaterial as SpeckleDepthMaterial
        if (depthMaterial) {
          depthMaterial.userData.uViewer_low.value.copy(
            this._renderer.RTEBuffers.shadowViewerLow
          )
          depthMaterial.userData.uViewer_high.value.copy(
            this._renderer.RTEBuffers.shadowViewerHigh
          )
          depthMaterial.userData.rteModelViewMatrix.value.copy(
            this._renderer.RTEBuffers.rteShadowViewModelMatrix
          )
          depthMaterial.needsUpdate = true
        }
      })
    }
  }

  private updateTransforms() {
    const meshBatches = this.batcher.getBatches(undefined, GeometryType.MESH)
    for (let k = 0; k < meshBatches.length; k++) {
      const meshBatch: SpeckleMesh | SpeckleInstancedMesh = meshBatches[k]
        .renderObject as SpeckleMesh | SpeckleInstancedMesh
      meshBatch.updateTransformsUniform()
      meshBatch.traverse((obj: Object3D) => {
        const depthMaterial: SpeckleDepthMaterial =
          obj.customDepthMaterial as SpeckleDepthMaterial
        if (depthMaterial) {
          meshBatch.updateMaterialTransformsUniform(depthMaterial)
        }
      })
    }
  }

  private updateFrustum() {
    const v = new Vector3()
    const box = this.sceneBox
    const camPos = new Vector3().copy(this.renderingCamera.position)
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
    this.renderingCamera.far = d * 2
    this.renderingCamera.updateProjectionMatrix()
  }

  public resetPipeline() {
    this._needsRender = true
    this.pipeline.reset()
    // if (force) this.pipeline.reset()
  }

  public render(): void {
    if (this._renderOverride) {
      this._renderOverride()
      return
    }

    if (!this._cameraProvider) return
    if (this._needsRender || this.pipeline.needsAccumulation) {
      this._renderinStats.frameStart()
      this.batcher.render(this.renderer)
      this._needsRender = this.pipeline.render()
      // this._needsRender = true
      this._renderinStats.frameEnd()

      if (this.sunConfiguration.shadowcatcher) {
        this._shadowcatcher.render(this._renderer)
      }
      // console.log('Get transparent time -> ', InstancedMeshBatch.transparentTime)
    }
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height)
    this.pipeline.resize(width, height)
    this._needsRender = true
  }

  public async *addRenderTree(subtreeId: string) {
    this.cancel[subtreeId] = false
    const subtreeGroup = new Group()
    subtreeGroup.name = subtreeId
    subtreeGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this.rootGroup.add(subtreeGroup)

    const generator = this.batcher.makeBatches(
      this.viewer.getWorldTree(),
      this.viewer.getWorldTree().getRenderTree(subtreeId),
      SpeckleTypeAllRenderables
    )
    let currentBatchCount = 0
    let lastBatchCount = -1
    this._renderOverride = () => {
      if (currentBatchCount > lastBatchCount) {
        this.pipeline.render()
        lastBatchCount = currentBatchCount
      }
    }

    for await (const batch of generator) {
      if (!batch) continue

      this.addBatch(batch, subtreeGroup)
      if (batch.geometryType === GeometryType.MESH) {
        this.updateDirectLights()
      }

      if (this.cancel[subtreeId]) {
        generator.return()
        this.removeRenderTree(subtreeId)
        delete this.cancel[subtreeId]
        break
      }
      currentBatchCount++
      yield
    }

    this._renderOverride = null
    this.updateHelpers()

    /** We'll just update the shadowcatcher after all batches are loaded */
    this.updateShadowCatcher()
    delete this.cancel[subtreeId]
  }

  private addBatch(batch: Batch, parent: Object3D) {
    const batchRenderable = batch.renderObject
    parent.add(batch.renderObject)

    if (batch.geometryType === GeometryType.MESH) {
      batchRenderable.traverse((obj: Object3D) => {
        if (obj instanceof Mesh) {
          obj.castShadow = !obj.material.transparent
          obj.receiveShadow = !obj.material.transparent
          obj.customDepthMaterial = new SpeckleDepthMaterial(
            {
              depthPacking: RGBADepthPacking
            },
            ['USE_RTE', 'ALPHATEST_REJECTION']
          )
        }
      })

      const meshRenderable = batchRenderable as SpeckleMesh | SpeckleInstancedMesh
      meshRenderable.TAS.boxHelpers.forEach((helper: Box3Helper) => {
        this.scene.add(helper)
      })
    }
    this.viewer.World.expandWorld(batch.bounds)
  }

  public removeRenderTree(subtreeId: string) {
    this.rootGroup.remove(this.rootGroup.getObjectByName(subtreeId))
    this.updateShadowCatcher()

    const batches = this.batcher.getBatches(subtreeId)
    batches.forEach((value) => {
      this.viewer.World.reduceWorld(value.bounds)
    })

    this.batcher.purgeBatches(subtreeId)
    this.updateDirectLights()
    this.updateHelpers()
  }

  public cancelRenderTree(subtreeId: string) {
    if (this.cancel[subtreeId] !== undefined) {
      this.cancel[subtreeId] = true
    }
  }

  public setMaterial(rvs: NodeRenderView[], material: Material)
  public setMaterial(
    rvs: NodeRenderView[],
    material: RenderMaterial & DisplayStyle & MaterialOptions
  )
  public setMaterial(rvs: NodeRenderView[], material: FilterMaterial)
  public setMaterial(rvs: NodeRenderView[], material) {
    if (!material) return

    const rvMap = {}
    for (let k = 0; k < rvs.length; k++) {
      if (!rvs[k].batchId) {
        continue
      }
      if (!rvMap[rvs[k].batchId]) rvMap[rvs[k].batchId] = []
      rvMap[rvs[k].batchId].push(rvs[k])
    }

    if (Materials.isMaterialInstance(material)) {
      this.setMaterialInstance(rvMap, material)
    } else if (Materials.isFilterMaterial(material)) {
      this.setFilterMaterial(rvMap, material as FilterMaterial)
    } else if (
      Materials.isRendeMaterial(material) ||
      Materials.isDisplayStyle(material)
    ) {
      this.setDataMaterial(
        rvMap,
        material as RenderMaterial & DisplayStyle & MaterialOptions
      )
    }
  }

  private setMaterialInstance(
    rvs: Record<string, NodeRenderView[]>,
    material: Material
  ) {
    for (const k in rvs) {
      const ranges = rvs[k].map((value: NodeRenderView) => {
        return { offset: value.batchStart, count: value.batchCount, material }
      })
      if (this.batcher.batches[k]) this.batcher.batches[k].setDrawRanges(...ranges)
    }
  }

  private setFilterMaterial(
    rvs: Record<string, NodeRenderView[]>,
    material: FilterMaterial
  ) {
    for (const k in rvs) {
      const drawRanges = rvs[k].map((value: NodeRenderView) => {
        return {
          offset: value.batchStart,
          count: value.batchCount,
          material: this.batcher.materials.getFilterMaterial(value, material),
          materialOptions: this.batcher.materials.getFilterMaterialOptions(material)
        }
      })
      if (this.batcher.batches[k]) this.batcher.batches[k].setDrawRanges(...drawRanges)
    }
  }

  private setDataMaterial(
    rvs: Record<string, NodeRenderView[]>,
    materialData: RenderMaterial & DisplayStyle & MaterialOptions
  ) {
    for (const k in rvs) {
      const drawRanges = rvs[k].map((value: NodeRenderView) => {
        const material = this.batcher.materials.getDataMaterial(value, materialData)
        ;(material as unknown as SpeckleMaterial).setMaterialOptions(materialData)
        return {
          offset: value.batchStart,
          count: value.batchCount,
          material
        }
      })
      if (this.batcher.batches[k]) this.batcher.batches[k].setDrawRanges(...drawRanges)
    }
  }

  public getMaterial(rv: NodeRenderView): Material {
    if (!rv || !rv.batchId) {
      return null
    }
    return this.batcher.getBatch(rv).getMaterial(rv)
  }

  public getBatchMaterial(rv: NodeRenderView): Material {
    if (!rv || !rv.batchId) {
      return null
    }
    return this.batcher.getBatch(rv).batchMaterial
  }

  public resetMaterials() {
    this.batcher.resetBatchesDrawRanges()
  }

  public getBatch(id: string): Batch {
    return this.batcher.batches[id]
  }

  protected updateClippingPlanes(planes?: Plane[]) {
    if (!this.allObjects) return
    if (!planes) planes = this._clippingPlanes

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
    this._shadowcatcher.updateClippingPlanes(planes)
    this.renderer.shadowMap.needsUpdate = true
    this.resetPipeline()
  }

  public updateShadowCatcher() {
    this._shadowcatcher.shadowcatcherMesh.visible = this.sunConfiguration.shadowcatcher
    if (this.sunConfiguration.shadowcatcher) {
      this._shadowcatcher.bake(
        this.clippingVolume,
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
    this.updateHelpers()
  }

  public setSunLightConfiguration(config: SunLightConfiguration) {
    Object.assign(this.sunConfiguration, config)
    if (config.indirectLightIntensity !== undefined) {
      this.indirectIBLIntensity = config.indirectLightIntensity
    }
    this.updateDirectLights()
    this.updateShadowCatcher()
    this.viewer.emit(ViewerEvent.LightConfigUpdated, { ...config })
  }

  public updateHelpers() {
    if (this.SHOW_HELPERS) {
      ;(this._scene.getObjectByName('CamHelper') as CameraHelper).update()
      // Thank you prettier, this looks so much better
      ;(this._scene.getObjectByName('SceneBoxHelper') as Box3Helper).box.copy(
        this.clippingVolume
      )
      ;(
        this._scene.getObjectByName('DirLightHelper') as DirectionalLightHelper
      ).update()
    }
  }

  public queryHits(
    results: Array<ExtendedIntersection>
  ): Array<{ node: TreeNode; point: Vector3 }> {
    const rvs = []
    const points = []
    for (let k = 0; k < results.length; k++) {
      const rv = this.renderViewFromIntersection(results[k])
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
      const subtreeId = rvs[k].renderData.subtreeId
      const hitNode = this.viewer.getWorldTree().findId(hitId, subtreeId)[0]
      let parentNode = hitNode
      while (!parentNode.model.atomic && parentNode.parent) {
        parentNode = parentNode.parent
      }
      queryResult.push({ node: parentNode, point: points[k] })
    }
    return queryResult
  }

  public queryHitIds(
    results: Array<ExtendedIntersection>
  ): Array<{ nodeId: string; point: Vector3 }> {
    const queryResult = []
    for (let k = 0; k < results.length; k++) {
      let rv = results[k].batchObject?.renderView
      if (!rv) {
        rv = this.batcher.getRenderView(
          results[k].object.uuid,
          results[k].faceIndex !== undefined ? results[k].faceIndex : results[k].index
        )
      }
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

  public renderViewFromIntersection(
    intersection: ExtendedIntersection
  ): NodeRenderView {
    let rv = null
    if (intersection.batchObject) {
      rv = intersection.batchObject.renderView
      const material = (intersection.object as SpeckleMesh).getBatchObjectMaterial(
        intersection.batchObject
      )
      if (material.opacity === 0 && this.IGNORE_ZERO_OPACITY_OBJECTS) return null
    } else {
      rv = this.batcher.getRenderView(
        intersection.object.uuid,
        intersection.faceIndex !== undefined
          ? intersection.faceIndex
          : intersection.index
      )
      if (rv) {
        const material = this.batcher.getRenderViewMaterial(
          intersection.object.uuid,
          intersection.faceIndex !== undefined
            ? intersection.faceIndex
            : intersection.index
        )
        if (material.opacity === 0 && this.IGNORE_ZERO_OPACITY_OBJECTS) return null
      }
    }

    return rv
  }

  private onClick(e) {
    const results: Array<Intersection> = this._intersections.intersect(
      this._scene,
      this.renderingCamera,
      e,
      true,
      this.clippingVolume
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
        !multiSelect ? null : { multiple: true, event: e.event }
      )
      return
    }

    const selectionInfo = {
      multiple: multiSelect,
      event: e.event,
      hits: queryResults.map((value) => {
        return {
          node: value.node,
          point: value.point
        }
      })
    } as SelectionEvent
    this.viewer.emit(ViewerEvent.ObjectClicked, selectionInfo)
  }

  private onDoubleClick(e) {
    const results: Array<Intersection> = this._intersections.intersect(
      this._scene,
      this.renderingCamera,
      e,
      true,
      this.clippingVolume
    )
    if (!results) {
      this.viewer.emit(ViewerEvent.ObjectDoubleClicked, null)
      return
    }

    let multiSelect = false
    if (e.multiSelect) multiSelect = true

    const queryResults = this.queryHits(results)
    if (!queryResults) {
      this.viewer.emit(ViewerEvent.ObjectDoubleClicked, null)
      return
    }

    const selectionInfo = {
      multiple: multiSelect,
      hits: queryResults.map((value) => {
        return {
          node: value.node,
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
      for (let k = 0; k < objectIds.length; k++) {
        const nodes = this.viewer.getWorldTree().findId(objectIds[k])
        nodes.forEach((node: TreeNode) => {
          rvs.push(
            ...this.viewer
              .getWorldTree()
              .getRenderTree()
              .getRenderViewsForNode(node, node)
          )
        })
      }
    } else box = this.sceneBox
    for (let k = 0; k < rvs.length; k++) {
      const object = this.getObject(rvs[k])
      const aabb = object ? object.aabb : rvs[k].aabb
      if (aabb) {
        box.union(aabb)
      }
    }
    if (box.getSize(new Vector3()).length() === 0) {
      console.error(`object selection resulted in empty box`)
    }
    return box
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

  public debugShowBatches() {
    for (const k in this.batcher.batches) {
      const renderMat = {
        id: 'string',
        color: Math.floor(Math.random() * 16777215),
        opacity: 1,
        roughness: 1,
        metalness: 0,
        vertexColors: false,
        lineWeight: 1
      } as RenderMaterial & DisplayStyle & MaterialOptions
      this.setMaterial(this.batcher.batches[k].renderViews, renderMat)
    }
  }

  public getBatchIds() {
    const batches = Object.values(this.batcher.batches)
    batches.sort((a, b) => a.renderViews.length - b.renderViews.length)
    const ids = []
    for (let k = 0; k < batches.length; k++) {
      ids.push(batches[k].id)
    }
    return ids.reverse()
  }

  public getBatchSize(batchId: string) {
    return this.batcher.batches[batchId].renderViews.length
  }

  public isolateBatch(batchId: string) {
    this.batcher.resetBatchesDrawRanges()
    this.batcher.isolateBatch(batchId)
  }

  public getObjects(): BatchObject[] {
    const batches = this.batcher.getBatches(undefined, GeometryType.MESH) as MeshBatch[]
    const meshes = batches.map((batch: MeshBatch) => batch.mesh)
    const objects = meshes.flatMap((mesh) => mesh.batchObjects)
    return objects
  }

  public getObject(rv: NodeRenderView): BatchObject {
    const batch = this.batcher.getBatch(rv) as MeshBatch
    if (batch.geometryType !== GeometryType.MESH) {
      // Logger.error('Render view is not of mesh type. No batch object found')
      return null
    }
    return batch.mesh.batchObjects.find((value) => value.renderView.guid === rv.guid)
  }

  public enableLayers(layers: ObjectLayers[], value: boolean) {
    this.pipeline.composer.passes.forEach((pass: BaseSpecklePass) => {
      if (!(pass instanceof BaseSpecklePass)) return
      layers.forEach((layer: ObjectLayers) => {
        pass.enableLayer(layer, value)
      })
    })
  }
}
