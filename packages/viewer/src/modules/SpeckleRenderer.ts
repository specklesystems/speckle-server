import {
  ACESFilmicToneMapping,
  Box3,
  Box3Helper,
  CameraHelper,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  Group,
  type Intersection,
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
  VSMShadowMap,
  Vector2,
  PerspectiveCamera,
  OrthographicCamera
} from 'three'
import { type Batch, type BatchUpdateRange, GeometryType } from './batching/Batch.js'
import Batcher from './batching/Batcher.js'
import { Geometry } from './converter/Geometry.js'
import Input, { InputEvent } from './input/Input.js'
import { Intersections } from './Intersections.js'
import SpeckleDepthMaterial from './materials/SpeckleDepthMaterial.js'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial.js'
import { NodeRenderView } from './tree/NodeRenderView.js'
import { Viewer } from './Viewer.js'
import { WorldTree, type TreeNode } from './tree/WorldTree.js'
import {
  DefaultLightConfiguration,
  ObjectLayers,
  type SelectionEvent,
  type SunLightConfiguration,
  ViewerEvent
} from '../IViewer.js'
import { Shadowcatcher } from './Shadowcatcher.js'
import SpeckleMesh from './objects/SpeckleMesh.js'
import { type ExtendedIntersection } from './objects/SpeckleRaycaster.js'
import { BatchObject } from './batching/BatchObject.js'
import { CameraEvent, type SpeckleCamera } from './objects/SpeckleCamera.js'
import Materials, {
  type RenderMaterial,
  type DisplayStyle,
  type FilterMaterial,
  type FilterMaterialOptions
} from './materials/Materials.js'
import { type MaterialOptions } from './materials/MaterialOptions.js'
import { SpeckleMaterial } from './materials/SpeckleMaterial.js'
import { SpeckleWebGLRenderer } from './objects/SpeckleWebGLRenderer.js'
import { SpeckleTypeAllRenderables } from './loaders/GeometryConverter.js'
import SpeckleInstancedMesh from './objects/SpeckleInstancedMesh.js'
import { MeshBatch } from './batching/MeshBatch.js'
import { RenderTree } from './tree/RenderTree.js'
import { Pipeline } from './pipeline/Pipelines/Pipeline.js'
import { DefaultPipeline } from './pipeline/Pipelines/DefaultPipeline.js'
import { ProgressivePipeline } from './pipeline/Pipelines/ProgressivePipeline.js'
import { BaseGPass, GPass } from './pipeline/Passes/GPass.js'

export class RenderingStats {
  private renderTimeAcc = 0
  private renderTimeSamples = 0
  private readonly renderTimeMaxSamples = 500
  private renderTimeStart = 0
  public renderTime = 0

  public objects: number = 0
  public batchCount: number = 0
  public drawCalls: number = 0
  public trisCount: number = 0
  public vertCount: number = 0

  public batchDetails!: Array<{
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
  protected readonly SHOW_HELPERS = false
  protected readonly IGNORE_ZERO_OPACITY_OBJECTS = true
  public SHOW_BVH = false

  protected _renderer: SpeckleWebGLRenderer
  protected _renderinStats: RenderingStats
  protected _scene: Scene
  protected _needsRender: boolean
  protected _intersections: Intersections
  protected _shadowcatcher: Shadowcatcher
  protected _speckleCamera: SpeckleCamera | null = null

  protected container: HTMLElement
  protected rootGroup: Group
  protected _pipeline: Pipeline

  protected sun: DirectionalLight
  protected sunConfiguration: SunLightConfiguration = DefaultLightConfiguration
  protected sunTarget: Object3D
  protected tree: WorldTree

  protected cancel: { [subtreeId: string]: boolean } = {}

  protected _clippingPlanes: Plane[] = []
  protected _clippingVolume: Box3 = new Box3()

  protected _renderOverride: (() => void) | null = null

  public viewer: Viewer // TEMPORARY
  public batcher: Batcher
  public input: Input

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
  public get sceneBox(): Box3 {
    const bounds: Box3 = new Box3()
    const batches = this.batcher.getBatches()
    for (let k = 0; k < batches.length; k++) {
      bounds.union(batches[k].bounds)
    }
    return bounds
  }

  public get sceneSphere(): Sphere {
    return this.sceneBox.getBoundingSphere(new Sphere())
  }

  public get sceneCenter(): Vector3 {
    return this.sceneBox.getCenter(new Vector3())
  }

  public get clippingVolume(): Box3 {
    return !this._clippingVolume.isEmpty() && this._renderer.localClippingEnabled
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
    this.renderer.shadowMap.needsUpdate = true
    this.needsRender = true
    this.resetPipeline()
  }

  /****************
   * Common Objects */
  public get allObjects(): Object3D {
    return this._scene.getObjectByName('ContentGroup') as Object3D
  }

  public get scene() {
    return this._scene
  }

  /********
   * Lights */

  public get sunLight(): DirectionalLight {
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
  public get speckleCamera(): SpeckleCamera | null {
    return this._speckleCamera
  }

  public set speckleCamera(value: SpeckleCamera) {
    this._speckleCamera = value
    this._speckleCamera.on(CameraEvent.Dynamic, () => {
      this._needsRender = true
      this._pipeline instanceof ProgressivePipeline && this._pipeline.onStationaryEnd()
    })
    this._speckleCamera.on(CameraEvent.Stationary, () => {
      this._needsRender = true
      this._pipeline instanceof ProgressivePipeline &&
        this._pipeline.onStationaryBegin()
    })
    this._speckleCamera.on(CameraEvent.FrameUpdate, (needsUpdate: boolean) => {
      this.needsRender = needsUpdate
    })
  }

  public get renderingCamera(): PerspectiveCamera | OrthographicCamera | null {
    if (!this._speckleCamera) return null
    return this._speckleCamera.renderingCamera
  }

  /**********
   * Pipeline */
  public set pipeline(value: Pipeline) {
    this._pipeline = value
    this._pipeline.setClippingPlanes(this._clippingPlanes)
    this._pipeline.reset()
    this.resize()
  }

  public get pipeline(): Pipeline {
    return this._pipeline
  }

  public get shadowcatcher(): Shadowcatcher | null {
    return this._shadowcatcher
  }

  /**************
   * Intersections */
  public get intersections(): Intersections {
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

  public constructor(tree: WorldTree, viewer: Viewer /** TEMPORARY */) {
    this.tree = tree
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

    /** No autoclear. We're clearing ourselves */
    this._renderer.autoClear = false
    this._renderer.autoClearColor = false
    this._renderer.autoClearDepth = false
    this._renderer.autoClearStencil = false

    this.container = container
    this._renderer.setSize(container.offsetWidth, container.offsetHeight)
    container.appendChild(this._renderer.domElement)

    this.batcher = new Batcher(
      this.renderer.capabilities.maxVertexUniforms,
      this.renderer.capabilities.floatVertexTextures
    )

    this._pipeline = new DefaultPipeline(this)

    this.input = new Input(this._renderer.domElement)
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
    ])
    let restoreVisibility: Record<string, BatchUpdateRange>
    let opaque: Record<string, BatchUpdateRange>

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
    if (!this.renderingCamera) return
    this.batcher.update(deltaTime)

    this.renderingCamera.updateMatrixWorld(true)
    this._renderer.updateRTEViewModel(this.renderingCamera)
    this.updateRTEShadows()

    this.updateTransforms()

    this._pipeline.update(this.renderingCamera)

    if (this.sunConfiguration.shadowcatcher && this._shadowcatcher) {
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

    const meshBatches: MeshBatch[] = this.batcher.getBatches(
      undefined,
      GeometryType.MESH
    )
    for (let k = 0; k < meshBatches.length; k++) {
      const speckleMesh: SpeckleMesh | SpeckleInstancedMesh = meshBatches[k].mesh

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
    const meshBatches: MeshBatch[] = this.batcher.getBatches(
      undefined,
      GeometryType.MESH
    )
    for (let k = 0; k < meshBatches.length; k++) {
      const meshBatch: SpeckleMesh | SpeckleInstancedMesh = meshBatches[k].mesh
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

  public resetPipeline() {
    this._needsRender = true
    this._pipeline.reset()
  }

  public render(): void {
    if (this._renderOverride) {
      this._renderOverride()
      return
    }

    if (!this._speckleCamera) return

    if (this._needsRender) {
      this._renderinStats.frameStart()
      this.batcher.render(this.renderer)
      this._needsRender = this._pipeline.render()
      this._renderinStats.frameEnd()

      if (this.sunConfiguration.shadowcatcher && this._shadowcatcher) {
        this._shadowcatcher.render(this._renderer)
      }
    }
  }

  public resize(width?: number, height?: number) {
    if (!width || !height) {
      const size = this._renderer.getSize(new Vector2())
      width = size.x
      height = size.y
    }
    width = Math.floor(width)
    height = Math.floor(height)
    this.renderer.setSize(width, height)
    const dpr = this._renderer.getPixelRatio()
    this._pipeline.resize(width * dpr, height * dpr)
    this._pipeline.reset()
    this._needsRender = true
  }

  public async *addRenderTree(renderTree: RenderTree) {
    this.cancel[renderTree.id] = false
    const subtreeGroup = new Group()
    subtreeGroup.name = renderTree.id
    subtreeGroup.layers.set(ObjectLayers.STREAM_CONTENT)
    this.rootGroup.add(subtreeGroup)

    const generator = this.batcher.makeBatches(
      this.tree,
      renderTree,
      SpeckleTypeAllRenderables
    )
    let currentBatchCount = 0
    let lastBatchCount = -1
    this._renderOverride = () => {
      if (currentBatchCount > lastBatchCount) {
        this._pipeline.render()
        lastBatchCount = currentBatchCount
      }
    }

    for await (const batch of generator) {
      if (!batch) continue

      this.addBatch(batch, subtreeGroup)
      if (batch.geometryType === GeometryType.MESH) {
        this.updateDirectLights()
      }

      if (this.cancel[renderTree.id]) {
        void generator.return()
        this.removeRenderTree(renderTree.id)
        delete this.cancel[renderTree.id]
        break
      }
      currentBatchCount++
      yield
    }

    this._renderOverride = null
    this.updateHelpers()

    /** We'll just update the shadowcatcher after all batches are loaded */
    this.updateShadowCatcher()
    this.updateClippingPlanes()
    if (this._speckleCamera) this._speckleCamera.updateCameraPlanes(this.sceneBox)
    delete this.cancel[renderTree.id]
  }

  private addBatch(batch: Batch, parent: Object3D) {
    const batchRenderable = batch.renderObject
    parent.add(batchRenderable)
    if (
      batchRenderable instanceof SpeckleMesh ||
      batchRenderable instanceof SpeckleInstancedMesh
    ) {
      if (batchRenderable.TAS.bvhHelper) parent.add(batchRenderable.TAS.bvhHelper)
    }
    if (batch.geometryType === GeometryType.MESH) {
      batchRenderable.traverse((obj: Object3D) => {
        if (obj instanceof Mesh) {
          const material = Array.isArray(obj.material) ? obj.material[0] : obj.material

          obj.castShadow = !material.transparent
          obj.receiveShadow = !material.transparent
          obj.customDepthMaterial = new SpeckleDepthMaterial(
            {
              depthPacking: RGBADepthPacking
            },
            ['USE_RTE', 'ALPHATEST_REJECTION']
          )
        }
      })
    }
    this.viewer.World.expandWorld(batch.bounds)
  }

  public removeRenderTree(subtreeId: string) {
    this.rootGroup.remove(this.rootGroup.getObjectByName(subtreeId) as Object3D)
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

  public setMaterial(rvs: NodeRenderView[], material: Material): void
  public setMaterial(
    rvs: NodeRenderView[],
    material: RenderMaterial & DisplayStyle & MaterialOptions
  ): void
  public setMaterial(rvs: NodeRenderView[], material: FilterMaterial): void
  public setMaterial(
    rvs: NodeRenderView[],
    material:
      | Material
      | (RenderMaterial & DisplayStyle & MaterialOptions)
      | FilterMaterial
  ): void {
    if (!material) return

    const rvMap: { [id: string]: NodeRenderView[] } = {}
    for (let k = 0; k < rvs.length; k++) {
      if (!rvs[k].batchId) {
        continue
      }
      if (!rvMap[rvs[k].batchId]) rvMap[rvs[k].batchId] = []
      if (!rvMap[rvs[k].batchId].includes(rvs[k])) rvMap[rvs[k].batchId].push(rvs[k])
    }

    if (Materials.isMaterialInstance(material)) {
      this.setMaterialInstance(rvMap, material)
    } else if (Materials.isFilterMaterial(material)) {
      this.setFilterMaterial(rvMap, material)
    } else if (
      Materials.isRendeMaterial(material) ||
      Materials.isDisplayStyle(material)
    ) {
      this.setDataMaterial(rvMap, material)
    }
  }

  private setMaterialInstance(
    rvs: Record<string, NodeRenderView[]>,
    material: Material
  ) {
    for (const k in rvs) {
      const drawRanges = rvs[k].map((value: NodeRenderView) => {
        return { offset: value.batchStart, count: value.batchCount, material }
      })
      if (this.batcher.batches[k])
        this.batcher.batches[k].setDrawRanges(this.flattenDrawRanges(drawRanges))
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
          material: this.batcher.materials.getFilterMaterial(
            value,
            material
          ) as Material,
          materialOptions: this.batcher.materials.getFilterMaterialOptions(
            material
          ) as FilterMaterialOptions
        }
      })
      if (this.batcher.batches[k])
        this.batcher.batches[k].setDrawRanges(this.flattenDrawRanges(drawRanges))
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

      if (this.batcher.batches[k])
        this.batcher.batches[k].setDrawRanges(this.flattenDrawRanges(drawRanges))
    }
  }

  /** TO DO!
   * This can mess up materials if multiple materials exist in the ranges argument */
  private flattenDrawRanges(ranges: Array<BatchUpdateRange>): Array<BatchUpdateRange> {
    if (ranges.length < 3) return ranges

    ranges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })

    const flatRanges = []
    let offset = ranges[0].offset
    let count = 0
    for (let k = 0; k < ranges.length - 1; k++) {
      count += ranges[k].count
      if (offset + count === ranges[k + 1].offset) {
        if (k === ranges.length - 2) {
          flatRanges.push({
            offset,
            count: count + ranges[k + 1].count,
            material: ranges[k].material,
            ...(ranges[k].materialOptions && {
              materialOptions: ranges[k].materialOptions
            })
          })
        }
        continue
      }
      flatRanges.push({
        offset,
        count,
        material: ranges[k].material,
        ...(ranges[k].materialOptions && {
          materialOptions: ranges[k].materialOptions
        })
      })
      offset = ranges[k + 1].offset
      count = 0
      if (k === ranges.length - 2) {
        flatRanges.push({
          offset: ranges[k + 1].offset,
          count: ranges[k + 1].count,
          material: ranges[k + 1].material,
          ...(ranges[k].materialOptions && {
            materialOptions: ranges[k].materialOptions
          })
        })
      }
    }

    return flatRanges
  }

  public getMaterial(rv: NodeRenderView): Material | null {
    if (!rv || !rv.batchId) {
      return null
    }
    return this.batcher.getBatch(rv).getMaterial(rv)
  }

  public getBatchMaterial(rv: NodeRenderView): Material | null {
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

  public updateClippingPlanes() {
    if (!this.allObjects) return
    const planes = this._clippingPlanes

    this.allObjects.traverse((object) => {
      const material = (object as unknown as { material: Material }).material
      if (!material) return
      if (!Array.isArray(material)) {
        material.clippingPlanes = planes
      } else {
        for (let k = 0; k < material.length; k++) {
          material[k].clippingPlanes = planes
        }
      }
    })
    this._pipeline.setClippingPlanes(planes)
    this._shadowcatcher?.updateClippingPlanes(planes)
  }

  public updateShadowCatcher() {
    if (this.sunConfiguration.shadowcatcher !== undefined)
      this._shadowcatcher.shadowcatcherMesh.visible =
        this.sunConfiguration.shadowcatcher
    if (this.sunConfiguration.shadowcatcher) {
      this._shadowcatcher.bake(
        this.clippingVolume,
        this._renderer.capabilities.maxTextureSize
      )
      this.needsRender = true
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

  private updateDirectLights() {
    const phi = this.sunConfiguration.elevation
    const theta = this.sunConfiguration.azimuth
    const radiusOffset = this.sunConfiguration.radius || 0
    if (this.sunConfiguration.castShadow !== undefined)
      this.sun.castShadow = this.sunConfiguration.castShadow
    if (this.sunConfiguration.intensity !== undefined)
      this.sun.intensity = this.sunConfiguration.intensity
    this.sun.color = new Color(this.sunConfiguration.color)
    if (this.sunConfiguration.enabled !== undefined)
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

  private updateHelpers() {
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
  ): Array<{ node: TreeNode; point: Vector3 }> | null {
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
      const hitNodes = this.tree.findId(hitId, subtreeId)
      if (!hitNodes) continue

      const hitNode = hitNodes[0]
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
  ): Array<{ nodeId: string; point: Vector3 }> | null {
    const queryResult = []
    for (let k = 0; k < results.length; k++) {
      let rv: NodeRenderView | null = results[k].batchObject
        ?.renderView as NodeRenderView
      if (!rv) {
        const index: number | undefined =
          results[k].faceIndex !== undefined ? results[k].faceIndex : results[k].index
        if (index) rv = this.batcher.getRenderView(results[k].object.uuid, index)
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

  // TO DO: Maybe need a better way
  public renderViewFromIntersection(
    intersection: ExtendedIntersection
  ): NodeRenderView | null {
    let rv = null
    if (intersection.batchObject) {
      rv = intersection.batchObject.renderView
      const material = (intersection.object as SpeckleMesh).getBatchObjectMaterial(
        intersection.batchObject
      )
      if (material && material.opacity === 0 && this.IGNORE_ZERO_OPACITY_OBJECTS)
        return null
    } else {
      const index =
        intersection.faceIndex !== undefined && intersection.faceIndex !== null
          ? intersection.faceIndex
          : intersection.index !== undefined && intersection.index !== null
          ? intersection.index
          : undefined
      if (index !== undefined) {
        rv = this.batcher.getRenderView(intersection.object.uuid, index)
        if (rv) {
          const material = this.batcher.getRenderViewMaterial(
            intersection.object.uuid,
            index
          )
          if (material && material.opacity === 0 && this.IGNORE_ZERO_OPACITY_OBJECTS)
            return null
        }
      }
    }

    return rv
  }

  private onClick(e: Vector2 & { multiSelect: boolean; event: PointerEvent }) {
    if (!this.renderingCamera) return

    const results: Array<Intersection> | null = this._intersections.intersect(
      this._scene,
      this.renderingCamera,
      e,
      undefined,
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

  private onDoubleClick(e: Vector2 & { multiSelect: boolean; event: PointerEvent }) {
    if (!this.renderingCamera) return

    const results: Array<Intersection> | null = this._intersections.intersect(
      this._scene,
      this.renderingCamera,
      e,
      undefined,
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

  public boxFromObjects(objectIds: string[]): Box3 {
    let box = new Box3()
    const rvs: NodeRenderView[] = []
    if (objectIds.length > 0) {
      for (let k = 0; k < objectIds.length; k++) {
        const nodes = this.tree.findId(objectIds[k])
        if (nodes)
          nodes.forEach((node: TreeNode) => {
            rvs.push(...this.tree.getRenderTree().getRenderViewsForNode(node))
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

  public getBatchSize(batchId: string): number {
    return this.batcher.batches[batchId].renderViews.length
  }

  public isolateBatch(batchId: string) {
    this.batcher.resetBatchesDrawRanges()
    this.batcher.isolateBatch(batchId)
  }

  public getObjects(): BatchObject[] {
    const batches = this.batcher.getBatches(undefined, GeometryType.MESH)
    const meshes = batches.map((batch: MeshBatch) => batch.mesh)
    const objects = meshes.flatMap((mesh) => mesh.batchObjects)
    return objects
  }

  public getObject(rv: NodeRenderView): BatchObject | null {
    const batch = this.batcher.getBatch(rv) as MeshBatch
    if (batch.geometryType !== GeometryType.MESH) {
      // Logger.error('Render view is not of mesh type. No batch object found')
      return null
    }
    return batch.mesh.batchObjects.find(
      (value) => value.renderView.guid === rv.guid
    ) as BatchObject
  }

  public enableLayers(layers: ObjectLayers[], value: boolean) {
    this._pipeline.passes.forEach((pass: GPass) => {
      if (!(pass instanceof BaseGPass)) return
      layers.forEach((layer: ObjectLayers) => {
        pass.enableLayer(layer, value)
      })
    })
  }
}
