import { Box3, SectionTool, SpeckleStandardMaterial, TreeNode } from '@speckle/viewer'
import {
  CanonicalView,
  Viewer,
  PropertyInfo,
  SelectionEvent,
  SunLightConfiguration,
  ViewerEvent,
  BatchObject,
  VisualDiffMode,
  MeasurementType,
  ExplodeExtension,
  DiffExtension,
  SpeckleLoader,
  ObjLoader,
  UrlHelper,
  LoaderEvent,
  UpdateFlags
} from '@speckle/viewer'
import { FolderApi, Pane } from 'tweakpane'
import { DiffResult } from '@speckle/viewer'
import type { PipelineOptions } from '@speckle/viewer/dist/modules/pipeline/Pipeline'
import { Units } from '@speckle/viewer'
import { SelectionExtension } from '@speckle/viewer'
import { FilteringExtension } from '@speckle/viewer'
import { MeasurementsExtension } from '@speckle/viewer'
import { CameraController } from '@speckle/viewer'
import { AssetType, Assets } from '@speckle/viewer'
import Neutral from '../assets/hdri/Neutral.png'
import Mild from '../assets/hdri/Mild.png'
import Mild2 from '../assets/hdri/Mild2.png'
import Sharp from '../assets/hdri/Sharp.png'
import Bright from '../assets/hdri/Bright.png'

import { Euler, Vector3 } from 'three'
import { GeometryType } from '@speckle/viewer'
import { MeshBatch } from '@speckle/viewer'

export default class Sandbox {
  private viewer: Viewer
  private pane: Pane
  private tabs
  private viewsFolder!: FolderApi
  private streams: { [url: string]: Array<unknown> } = {}
  private properties: PropertyInfo[]
  private selectionList: SelectionEvent[]
  private objectControls: FolderApi | null = null
  private batchesFolder: FolderApi | null = null
  public ids: Array<string> = []

  public urlParams = {
    url: 'https://latest.speckle.dev/streams/c43ac05d04/commits/ec724cfbeb'
  }

  public sceneParams = {
    worldSize: { x: 0, y: 0, z: 0 },
    worldOrigin: { x: 0, y: 0, z: 0 },
    pixelThreshold: 0.5,
    exposure: 0.5,
    tonemapping: 4, //'ACESFilmicToneMapping',
    contrast: 1,
    saturation: 1,
    hdri: Mild,
    minRoughness: 0.5
  }

  public pipelineParams = {
    pipelineOutput: 8,
    accumulationFrames: 16,
    dynamicAoEnabled: true,
    dynamicAoParams: {
      intensity: 1.5,
      scale: 0,
      kernelRadius: 5,
      bias: 0.2,
      normalsType: 2,
      blurEnabled: true,
      blurRadius: 2,
      blurStdDev: 4,
      blurDepthCutoff: 0.007
    },
    staticAoEnabled: true,
    staticAoParams: {
      intensity: 1,
      kernelRadius: 30, // Screen space
      kernelSize: 16,
      bias: 0.01,
      minDistance: 0,
      maxDistance: 0.008
    }
  } as PipelineOptions

  public lightParams: SunLightConfiguration = {
    enabled: true,
    castShadow: true,
    intensity: 5,
    color: 0xffffff,
    azimuth: 0.75,
    elevation: 1.33,
    radius: 0,
    indirectLightIntensity: 1.2,
    shadowcatcher: true
  }

  public batchesParams = {
    showBvh: false,
    totalBvhSize: 0,
    explode: 0,
    culling: true
  }

  public filterParams = {
    filterBy: 'Volume'
  }

  public shadowCatcherParams = {
    textureSize: 512,
    weights: { x: 1, y: 1, z: 0, w: 1 },
    blurRadius: 16,
    stdDeviation: 4,
    sigmoidRange: 1.1,
    sigmoidStrength: 2
  }

  public measurementsParams = {
    enabled: false,
    visible: true,
    type: MeasurementType.POINTTOPOINT,
    vertexSnap: true,
    units: 'm',
    precision: 2
  }

  public constructor(
    container: HTMLElement,
    viewer: Viewer,
    selectionList: SelectionEvent[]
  ) {
    this.viewer = viewer
    this.selectionList = selectionList
    this.pane = new Pane({ title: 'Speckle Sandbox', expanded: true })
    // Mad HTML/CSS skills
    container.appendChild(this.pane['containerElem_'])
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.pane['containerElem_'].style = 'pointer-events:auto;'

    this.tabs = this.pane.addTab({
      pages: [
        { title: 'General' },
        { title: 'Scene' },
        { title: 'Filtering' },
        { title: 'Batches' },
        { title: 'Diff' },
        { title: 'Measurements' }
      ]
    })
    this.properties = []

    viewer.on(ViewerEvent.LoadComplete, async (url: string) => {
      url
      this.addStreamControls(url)
      this.addViewControls()
      this.addBatches()
      this.properties = await this.viewer.getObjectProperties()
      this.batchesParams.totalBvhSize = this.getBVHSize()
      this.refresh()
    })
    viewer.on(ViewerEvent.UnloadComplete, async () => {
      this.removeViewControls()
      this.addViewControls()
      this.properties = await this.viewer.getObjectProperties()
    })
    viewer.on(ViewerEvent.UnloadAllComplete, async () => {
      this.removeViewControls()
      this.addViewControls()
      this.properties = await this.viewer.getObjectProperties()
    })
    viewer.on(ViewerEvent.ObjectClicked, (selectionEvent: SelectionEvent | null) => {
      if (selectionEvent && selectionEvent.hits) {
        const firstHitNode = selectionEvent.hits[0].node
        if (firstHitNode) {
          this.addObjectControls(firstHitNode)
        }
      }
    })
  }

  public refresh() {
    this.pane.refresh()
  }

  private addBatches() {
    if (this.batchesFolder) this.batchesFolder.dispose()

    this.batchesFolder = this.tabs.pages[3].addFolder({ title: 'Batches' })
    const batchIds = this.viewer.getRenderer().getBatchIds()
    for (let k = 0; k < batchIds.length; k++) {
      const button = this.batchesFolder.addButton({
        title: this.viewer.getRenderer().getBatchSize(batchIds[k]).toString()
      })
      button.on('click', () => {
        this.viewer.getRenderer().isolateBatch(batchIds[k])
        this.viewer.requestRender()
      })
    }
  }

  private addStreamControls(url: string) {
    const folder = this.tabs.pages[0].addFolder({
      title: `Object: ${url.split('/').reverse()[0]}`
    })

    folder.addInput({ url }, 'url', {
      title: 'URL',
      disabled: true
    })
    const position = { value: { x: 0, y: 0, z: 0 } }
    folder.addInput(position, 'value', { label: 'Position' }).on('change', () => {
      const tree = this.viewer.getWorldTree()
      const rvs = tree.getRenderTree(url)?.getRenderViewsForNodeId(url)
      if (rvs) {
        for (let k = 0; k < rvs.length; k++) {
          const object = this.viewer.getRenderer().getObject(rvs[k])
          if (object)
            object.transformTRS(position.value, undefined, undefined, undefined)
        }
      }
      this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      this.viewer.getRenderer().updateShadowCatcher()
    })

    folder
      .addButton({
        title: 'Unload'
      })
      .on('click', () => {
        this.removeStreamControls(url)
      })
    this.streams[url] = []
    this.streams[url].push(folder)
  }

  private removeStreamControls(url: string) {
    void this.viewer.unloadObject(url)
    ;(this.streams[url][0] as { dispose: () => void }).dispose()
    delete this.streams[url]
  }

  private addViewControls() {
    const views = this.viewer.getViews()
    this.viewsFolder = this.tabs.pages[0].addFolder({
      title: 'Views',
      expanded: true
    })
    for (let k = 0; k < views.length; k++) {
      const view = views[k]
      this.viewsFolder
        .addButton({
          title: view.name ? view.name : 'Unnamed'
        })
        .on('click', () => {
          this.viewer.getExtension(CameraController).setCameraView(views[k], true)
        })
    }
  }

  private removeViewControls() {
    this.viewsFolder.dispose()
  }

  public addObjectControls(node: TreeNode) {
    if (this.objectControls) {
      this.objectControls.dispose()
    }
    this.objectControls = this.tabs.pages[0].addFolder({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      title: `Object: ${node.model.id}`
    })

    const rvs = this.viewer.getWorldTree().getRenderTree().getRenderViewsForNode(node)
    const objects: BatchObject[] = []
    for (let k = 0; k < rvs.length; k++) {
      const batchObject = this.viewer.getRenderer().getObject(rvs[k])
      if (batchObject) {
        objects.push(batchObject)
      }
    }
    const position = { value: { x: 0, y: 0, z: 0 } }
    const rotation = { value: { x: 0, y: 0, z: 0 } }
    const scale = { value: { x: 1, y: 1, z: 1 } }
    this.objectControls
      .addInput(position, 'value', { label: 'Position' })
      .on('change', () => {
        // const unionBox: Box3 = new Box3()
        // objects.forEach((obj: BatchObject) => {
        //   unionBox.union(obj.renderView.aabb)
        // })
        // const origin = unionBox.getCenter(new Vector3())
        objects.forEach((obj: BatchObject) => {
          obj.transformTRS(position.value)
          // obj.position = new Vector3(
          //   position.value.x,
          //   position.value.y,
          //   position.value.z
          // )
        })
        this.viewer.requestRender()
      })

    this.objectControls
      .addInput(rotation, 'value', {
        label: 'Rotation Euler',
        x: { step: 0.1 },
        y: { step: 0.1 },
        z: { step: 0.1 }
      })
      .on('change', () => {
        // const unionBox: Box3 = new Box3()
        // objects.forEach((obj: BatchObject) => {
        //   unionBox.union(obj.renderView.aabb)
        // })
        // const origin = unionBox.getCenter(new Vector3())
        objects.forEach((obj: BatchObject) => {
          // obj.transformTRS(position.value, rotation.value, scale.value, origin)
          obj.euler = new Euler(
            rotation.value.x,
            rotation.value.y,
            rotation.value.z,
            'XYZ'
          )
        })
        this.viewer.requestRender()
      })

    this.objectControls
      .addInput(scale, 'value', {
        label: 'Scale',
        x: { step: 0.1 },
        y: { step: 0.1 },
        z: { step: 0.1 }
      })
      .on('change', () => {
        const unionBox: Box3 = new Box3()
        objects.forEach((obj: BatchObject) => {
          unionBox.union(obj.renderView.aabb || new Box3())
        })
        const origin = unionBox.getCenter(new Vector3())
        objects.forEach((obj: BatchObject) => {
          obj.transformTRS(position.value, rotation.value, scale.value, origin)
        })
        this.viewer.requestRender()
      })
  }

  public makeGenericUI() {
    this.tabs.pages[0].addInput(this.urlParams, 'url', {
      title: 'url'
    })

    const loadButton = this.tabs.pages[0].addButton({
      title: 'Load Url'
    })

    loadButton.on('click', () => {
      void this.loadUrl(this.urlParams.url)
    })

    const loadObjButton = this.tabs.pages[0].addButton({
      title: 'Load OBJ'
    })
    loadObjButton.on('click', async () => {
      /** Load from string */
      const input = document.createElement('input')
      input.type = 'file'
      input.onchange = (e) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const file = e.target?.files[0] as Blob & { name: string }

        const reader = new FileReader()
        reader.readAsText(file, 'UTF-8')

        reader.onload = async (readerEvent) => {
          const content = readerEvent?.target?.result as string
          const loader = new ObjLoader(this.viewer.getWorldTree(), file.name, content)
          await this.viewer.loadObject(loader, true)
        }
      }
      input.click()
      /** Load as resource */
      // import BrandenburgGate from '../assets/BrandenburgGate.png'
      // const loader = new ObjLoader(this.viewer.getWorldTree(), brandnburd)
      // await this.viewer.loadObject(loader, true)
    })

    const clearButton = this.tabs.pages[0].addButton({
      title: 'Clear All'
    })

    clearButton.on('click', () => {
      void this.viewer.unloadAll()
    })

    this.tabs.pages[0].addSeparator()
    this.tabs.pages[0].addSeparator()

    const toggleSectionBox = this.tabs.pages[0].addButton({
      title: 'Toggle Section Box'
    })
    toggleSectionBox.on('click', () => {
      let box = this.viewer.getRenderer().boxFromObjects(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        this.selectionList.map((val) => val.hits[0].node.model.raw.id) as string[]
      )
      if (!box) {
        box = this.viewer.getRenderer().sceneBox
      }
      this.viewer.getExtension(SectionTool).setBox(box)
      this.viewer.getExtension(SectionTool).toggle()
    })

    const toggleProjection = this.tabs.pages[0].addButton({
      title: 'Toggle Projection'
    })
    toggleProjection.on('click', () => {
      this.viewer.getExtension(CameraController).toggleCameras()
    })

    const zoomExtents = this.tabs.pages[0].addButton({
      title: 'Zoom Extents'
    })
    zoomExtents.on('click', () => {
      this.viewer.getExtension(CameraController).setCameraView(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        this.selectionList.map((val) => val.hits[0].node.model.id) as string[],
        true
      )
    })

    this.tabs.pages[0].addSeparator()
    this.tabs.pages[0].addSeparator()

    const darkModeToggle = this.tabs.pages[0].addButton({
      title: '🌞 / 🌛'
    })
    const dark = localStorage.getItem('dark') === 'dark'
    if (dark) {
      console.log(document.getElementById('multi-root'))
      document.getElementById('multi-root')?.classList.toggle('background-dark')
      document.getElementById('renderer')?.classList.toggle('background-dark')
    }

    darkModeToggle.on('click', () => {
      let dark = false
      if (document.getElementById('renderer'))
        dark =
          document.getElementById('renderer')?.classList.toggle('background-dark') ||
          false
      else
        dark =
          document.getElementById('multi-root')?.classList.toggle('background-dark') ||
          false

      localStorage.setItem('dark', dark ? `dark` : `light`)
    })

    const screenshot = this.tabs.pages[0].addButton({
      title: 'Screenshot'
    })
    screenshot.on('click', async () => {
      console.warn(await this.viewer.screenshot())
      // this.viewer
      //   .getExtension(FilteringExtension)
      //   .hideObjects([this.viewer.getWorldTree().root.model.children[0].id])
    })

    const rotate = this.tabs.pages[0].addButton({
      title: '360'
    })
    rotate.on('click', async () => {
      const waitForAnimation = async (ms = 70) =>
        await new Promise((resolve) => {
          setTimeout(resolve, ms)
        })
      for (let i = 0; i < 24; i++) {
        this.viewer
          .getExtension(CameraController)
          .setCameraView({ azimuth: Math.PI / 12, polar: 0 }, false)
        this.viewer.requestRender(UpdateFlags.RENDER_RESET)
        await waitForAnimation(1000)
      }
    })

    this.tabs.pages[0]
      .addInput({ dampening: 30 }, 'dampening', {
        label: 'Dampening',
        min: 0,
        max: 300,
        step: 10
      })
      .on('change', (value) => {
        this.viewer.getExtension(CameraController).options = {
          damperDecay: value.value
        }
      })

    const canonicalViewsFolder = this.tabs.pages[0].addFolder({
      title: 'Canonical Views',
      expanded: false
    })
    const sides = ['front', 'back', 'top', 'bottom', 'right', 'left', '3d']
    for (let k = 0; k < sides.length; k++) {
      canonicalViewsFolder
        .addButton({
          title: sides[k]
        })
        .on('click', () => {
          this.viewer
            .getExtension(CameraController)
            .setCameraView(sides[k] as CanonicalView, true)
        })
    }
  }

  makeSceneUI() {
    const worldFolder = this.tabs.pages[1].addFolder({
      title: 'World',
      expanded: true
    })
    worldFolder.addInput(this.sceneParams.worldSize, 'x', {
      disabled: true,
      label: 'Size-x',
      step: 0.00000001
    })
    worldFolder.addInput(this.sceneParams.worldSize, 'y', {
      disabled: true,
      label: 'Size-y',
      step: 0.00000001
    })
    worldFolder.addInput(this.sceneParams.worldSize, 'z', {
      disabled: true,
      label: 'Size-z',
      step: 0.00000001
    })
    worldFolder.addSeparator()
    worldFolder.addInput(this.sceneParams.worldOrigin, 'x', {
      disabled: true,
      label: 'Origin-x'
    })
    worldFolder.addInput(this.sceneParams.worldOrigin, 'y', {
      disabled: true,
      label: 'Origin-y'
    })
    worldFolder.addInput(this.sceneParams.worldOrigin, 'z', {
      disabled: true,
      label: 'Origin-z'
    })

    this.tabs.pages[1].addSeparator()
    const postFolder = this.tabs.pages[1].addFolder({
      title: 'Post',
      expanded: true
    })

    postFolder
      .addInput(this.sceneParams, 'tonemapping', {
        options: {
          Linear: 1,
          ACES: 4
        }
      })
      .on('change', () => {
        this.viewer.getRenderer().renderer.toneMapping = this.sceneParams.tonemapping
        this.viewer.requestRender()
      })

    postFolder
      .addInput(this.sceneParams, 'exposure', {
        min: 0,
        max: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().renderer.toneMappingExposure =
          this.sceneParams.exposure
        this.viewer.requestRender()
      })

    /** Disabled color grading for now 
    postFolder
      .addInput(this.sceneParams, 'contrast', {
        min: 0,
        max: 2
      })
      .on('change', () => {
        const batches = this.viewer
          .getRenderer()
          .batcher.getBatches(undefined, GeometryType.MESH)
        batches.forEach((batch: MeshBatch) => {
          const materials = batch.materials as SpeckleStandardMaterial[]
          materials.forEach((material: SpeckleStandardMaterial) => {
            material.userData.contrast.value = this.sceneParams.contrast
            material.needsCopy = true
          })
        })
        this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      })
    postFolder
      .addInput(this.sceneParams, 'saturation', {
        min: 0,
        max: 2
      })
      .on('change', () => {
        const batches = this.viewer
          .getRenderer()
          .batcher.getBatches(undefined, GeometryType.MESH)
        batches.forEach((batch: MeshBatch) => {
          const materials = batch.materials as SpeckleStandardMaterial[]
          materials.forEach((material: SpeckleStandardMaterial) => {
            material.userData.saturation.value = this.sceneParams.saturation
            material.needsCopy = true
          })
        })
        this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      })
      */

    postFolder
      .addInput(this.sceneParams, 'minRoughness', {
        label: 'Shininess',
        min: 0,
        max: 1,
        step: 0.05
      })
      .on('change', () => {
        const batches = this.viewer
          .getRenderer()
          .batcher.getBatches(undefined, GeometryType.MESH)
        batches.forEach((batch: MeshBatch) => {
          const materials = batch.materials as SpeckleStandardMaterial[]
          materials.forEach((material: SpeckleStandardMaterial) => {
            material.updateArtificialRoughness(1 - this.sceneParams.minRoughness)
          })
        })
        this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      })

    const pipelineFolder = this.tabs.pages[1].addFolder({
      title: 'Pipeline',
      expanded: true
    })
    pipelineFolder
      .addInput(this.pipelineParams, 'pipelineOutput', {
        options: {
          DEPTH_RGBA: 0,
          DEPTH: 1,
          COLOR: 2,
          GEOMETRY_NORMALS: 3,
          RECONSTRUCTED_NORMALS: 4,
          DYNAMIC_AO: 5,
          DYNAMIC_AO_BLURED: 6,
          PROGRESSIVE_AO: 7,
          FINAL: 8
        }
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    pipelineFolder
      .addInput(this.pipelineParams, 'accumulationFrames', {
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    const dynamicAoFolder = pipelineFolder.addFolder({
      title: 'Dynamic AO',
      expanded: false
    })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'intensity', { min: 0, max: 5 })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'kernelRadius', {
        min: 0,
        max: 500
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'bias', {
        min: -1,
        max: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })
    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'normalsType', {
        options: {
          DEFAULT: 0,
          ADVANCED: 1,
          ACCURATE: 2
        }
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'blurEnabled', {})
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'blurRadius', {
        min: 0,
        max: 10
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(this.pipelineParams.dynamicAoParams, 'blurDepthCutoff', {
        min: 0,
        max: 1,
        step: 0.00001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    const staticAoFolder = pipelineFolder.addFolder({
      title: 'Static AO',
      expanded: false
    })
    // staticAoFolder
    //   .addInput(Sandbox.pipelineParams, 'staticAoEnabled', {})
    //   .on('change', () => {
    //     this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
    //     this.viewer.requestRender()
    //   })
    staticAoFolder
      .addInput(this.pipelineParams.staticAoParams, 'intensity', {
        min: 0,
        max: 5,
        step: 0.01
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })
    // staticAoFolder
    //   .addInput(Sandbox.pipelineParams.staticAoParams, 'minDistance', {
    //     min: 0,
    //     max: 100,
    //     step: 0.000001
    //   })
    //   .on('change', () => {
    //     this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
    //     this.viewer.requestRender()
    //   })

    // staticAoFolder
    //   .addInput(Sandbox.pipelineParams.staticAoParams, 'maxDistance', {
    //     min: 0,
    //     max: 100,
    //     step: 0.000001
    //   })
    //   .on('change', () => {
    //     this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
    //     this.viewer.requestRender()
    //   })
    staticAoFolder
      .addInput(this.pipelineParams.staticAoParams, 'kernelRadius', {
        min: 0,
        max: 1000
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    staticAoFolder
      .addInput(this.pipelineParams.staticAoParams, 'bias', {
        min: -1,
        max: 1,
        step: 0.0001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    staticAoFolder
      .addInput(this.pipelineParams.staticAoParams, 'kernelSize', {
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = this.pipelineParams
        this.viewer.requestRender()
      })

    const lightsFolder = this.tabs.pages[1].addFolder({
      title: 'Lights',
      expanded: false
    })
    const directLightFolder = lightsFolder.addFolder({
      title: 'Direct',
      expanded: true
    })
    directLightFolder
      .addInput(this.lightParams, 'enabled', {
        label: 'Sun Enabled'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'castShadow', {
        label: 'Sun Shadows'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'intensity', {
        label: 'Sun Intensity',
        min: 0,
        max: 10
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'color', {
        view: 'color',
        label: 'Sun Color'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'elevation', {
        label: 'Sun Elevation',
        min: 0,
        max: Math.PI
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'azimuth', {
        label: 'Sun Azimuth',
        min: -Math.PI * 0.5,
        max: Math.PI * 0.5
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })
    directLightFolder
      .addInput(this.lightParams, 'radius', {
        label: 'Sun Radius',
        min: 0,
        max: 1000
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(this.lightParams)
      })

    directLightFolder
      .addInput({ bias: -0.001 }, 'bias', {
        label: 'Shadow Bias',
        min: -0.001,
        max: 0,
        step: 0.00001
      })
      .on('change', (value) => {
        this.viewer.getRenderer().sunLight.shadow.bias = value.value
        this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      })

    directLightFolder
      .addInput({ radius: 2 }, 'radius', {
        label: 'Shadow Radius',
        min: 0,
        max: 6,
        step: 1
      })
      .on('change', (value) => {
        this.viewer.getRenderer().sunLight.shadow.radius = value.value
        this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      })

    const indirectLightsFolder = lightsFolder.addFolder({
      title: 'Indirect',
      expanded: true
    })
    indirectLightsFolder
      .addInput(this.sceneParams, 'hdri', {
        label: 'HDRI',
        options: {
          Neutral,
          Mild,
          Mild2,
          Sharp,
          Bright
        }
      })
      .on('change', async (value) => {
        this.viewer.getRenderer().indirectIBL = await Assets.getEnvironment(
          {
            id: this.sceneParams.hdri,
            src: value.value,
            type: AssetType.TEXTURE_EXR
          },
          this.viewer.getRenderer().renderer
        )
        this.viewer.requestRender()
      })

    indirectLightsFolder
      .addInput(this.lightParams, 'indirectLightIntensity', {
        label: 'Probe Intensity',
        min: 0,
        max: 10
      })
      .on('change', (value) => {
        value
        this.viewer.setLightConfiguration(this.lightParams)
      })

    const shadowcatcherFolder = this.tabs.pages[1].addFolder({
      title: 'Shadowcatcher',
      expanded: true
    })

    shadowcatcherFolder
      .addInput(this.lightParams, 'shadowcatcher', { label: 'Enabled' })
      .on('change', (value) => {
        value
        this.viewer.setLightConfiguration(this.lightParams)
      })

    const updateShadowcatcher = () => {
      const shadowCatcher = this.viewer.getRenderer().shadowcatcher
      if (shadowCatcher) {
        shadowCatcher.configuration = this.shadowCatcherParams
        this.viewer.getRenderer().updateShadowCatcher()
      }
    }
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'textureSize', {
        label: 'Texture Size',
        min: 1,
        max: 1024,
        step: 1
      })
      .on('change', () => {
        updateShadowcatcher()
      })
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'weights', {
        label: 'weights',
        x: { min: 0, max: 100 },
        y: { min: 0, max: 100 },
        z: { min: -100, max: 100 },
        w: { min: -100, max: 100 }
      })
      .on('change', () => {
        updateShadowcatcher()
      })
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'blurRadius', {
        label: 'Blur Radius',
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        updateShadowcatcher()
      })
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'stdDeviation', {
        label: 'Blur Std Deviation',
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        updateShadowcatcher()
      })
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'sigmoidRange', {
        label: 'Sigmoid Range',
        min: -10,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        updateShadowcatcher()
      })
    shadowcatcherFolder
      .addInput(this.shadowCatcherParams, 'sigmoidStrength', {
        label: 'Sigmoid Strength',
        min: -10,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        updateShadowcatcher()
      })
  }

  makeFilteringUI() {
    const filteringFolder = this.tabs.pages[2].addFolder({
      title: 'Filtering',
      expanded: true
    })

    filteringFolder.addInput(this.filterParams, 'filterBy', {
      options: {
        Volume: 'parameters.HOST_VOLUME_COMPUTED.value',
        Area: 'parameters.HOST_AREA_COMPUTED.value',
        Elevation: 'Elevation',
        SpeckleType: 'speckle_type',
        DisplayName: 'DisplayName',
        EmbodiedCarbon: 'EmbodiedCarbon',
        Floor: 'Floor',
        Name: 'name',
        TypeName: 'parameters.SYMBOL_NAME_PARAM.value',
        Id: 'id',
        DSD: 'DSD.@TYPE'
      }
    })

    filteringFolder
      .addButton({
        title: 'Apply Filter'
      })
      .on('click', () => {
        const data = this.properties.find((value) => {
          return value.key === this.filterParams.filterBy
        }) as PropertyInfo
        this.viewer.getExtension(FilteringExtension).setColorFilter(data)
        this.pane.refresh()
      })

    filteringFolder
      .addButton({
        title: 'Clear Filters'
      })
      .on('click', () => {
        this.viewer.getExtension(FilteringExtension).resetFilters()
      })
  }

  public makeBatchesUI() {
    const container = this.tabs.pages[3]
    const showBatches = container.addButton({
      title: 'ShowBatches'
    })
    showBatches.on('click', () => {
      this.viewer.getRenderer().debugShowBatches()
      this.viewer.requestRender()
    })

    container.addInput(this.batchesParams, 'totalBvhSize', {
      label: 'BVH Size(MB)',
      disabled: true
    })
    container
      .addInput(this.batchesParams, 'explode', {
        label: 'Explode',
        min: 0,
        max: 1,
        step: 0.001
      })
      .on('change', (value) => {
        value
        this.viewer
          .getExtension(ExplodeExtension)
          .setExplode(this.batchesParams.explode)
      })
    // container
    //   .addInput(Sandbox.batchesParams, 'culling', {
    //     label: 'Culling'
    //   })
    //   .on('change', (value) => {
    //     this.viewer
    //       .getRenderer()
    //       .setExplodeTime(Sandbox.batchesParams.explode)
    //   })
  }

  public makeDiffUI() {
    const container = this.tabs.pages[4]
    const diffButton = container.addButton({
      title: 'Diff'
    })
    const diffParams = {
      time: 0,
      mode: VisualDiffMode.COLORED
    }
    let diffResult: DiffResult | null = null
    diffButton.on('click', async () => {
      diffResult = await this.viewer.getExtension(DiffExtension).diff(
        //building
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/bcf37136dea9fe9397cdfd84012f616a',
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/94af0a6b4eaa318647180f8c230cb867',
        // cubes
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/d2510c59c203b73473f8bbfe637e0552',
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/1c327da824fdb04629eb48675101d7b7',
        // sketchup
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/06bed1819e6c61d9df7196d424ab1eec',
        // 'https://latest.speckle.dev/streams/aea12cab71/objects/9026f1d6495789b9eab31b5028c9a8ef',
        //latest
        'https://latest.speckle.dev/streams/cdbe82b016/objects/c14d1a33fd68323193813ec215737472',
        'https://latest.speckle.dev/streams/cdbe82b016/objects/16676fc95a9ead877f6a825d9e28cbe8',
        //lines
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/3b42d6ef51d3110b4e33b9f8cdc9f357',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/774384d431fb34d447d4696abbc4b816',
        // points
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/7118603b197c00944f53be650ce721ec',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/4ffcf75dc4a28ed52500df73d08058ee',
        // randos
        // 'https://latest.speckle.dev/streams/3ed8357f29/objects/d8786c21f277be67a0ea2cd43a1930df',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/8247bbc53865b0e0cb5ee4e252e66216',
        // instances
        // 'https://speckle.xyz/streams/be0f962efb/objects/37639741c363a123100eda8044f2fe3f',
        // 'https://speckle.xyz/streams/be0f962efb/objects/746024a9d42eca632889ff9f7685d329',
        // blocks
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/a4e2fad01e69cd886ecbfedf221f5301',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/a3c6c58ef9872b17125c9ab2b009e5cd',
        // instances & hosting
        // 'https://speckle.xyz/streams/be0f962efb/objects/fb4f291a13f05f325a5575fddd4276d0',
        // 'https://speckle.xyz/streams/be0f962efb/objects/21cf63a1496e366b34501429ce7ad2f5',
        // bug
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/91d69894f2ac7b3b2b6de4616d89e478',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/ce55c0fb40e77fbfc894d4c27568f1f9',
        // bug
        // 'https://latest.speckle.dev/streams/0c6ad366c4/objects/03f0a8bf0ed8064865eda87a865c7212',
        // 'https://latest.speckle.dev/streams/0c6ad366c4/objects/33ef6b9b547dc9688eb40157b967eab9',
        // large
        // 'https://speckle.xyz/streams/e6f9156405/objects/650f358d8aac50168d9e9226ef6f5cbc',
        // 'https://latest.speckle.dev/streams/92b620fb17/objects/1154ca1d997ac631571db55f84cb703d',
        // cubes
        // 'https://latest.speckle.dev/streams/0c6ad366c4/objects/03f0a8bf0ed8064865eda87a865c7212',
        // 'https://latest.speckle.dev/streams/0c6ad366c4/objects/33ef6b9b547dc9688eb40157b967eab9',

        VisualDiffMode.COLORED,
        localStorage.getItem('AuthTokenLatest') as string
      )
    })
    const unDiffButton = container.addButton({
      title: 'Undiff'
    })
    unDiffButton.on('click', async () => {
      void this.viewer.getExtension(DiffExtension).undiff()
    })

    container
      .addInput(diffParams, 'time', {
        label: 'Diff Time',
        min: 0,
        max: 1,
        step: 0.1
      })
      .on('change', (value) => {
        if (!diffResult) return
        this.viewer.getExtension(DiffExtension).updateVisualDiff(value.value)
        this.viewer.requestRender()
      })
    container
      .addInput(diffParams, 'mode', {
        options: {
          COLORED: VisualDiffMode.COLORED,
          PLAIN: VisualDiffMode.PLAIN
        }
      })
      .on('change', (value) => {
        if (!diffResult) return
        this.viewer
          .getExtension(DiffExtension)
          .updateVisualDiff(diffParams.time, value.value)
        this.viewer.requestRender()
      })
  }

  public makeMeasurementsUI() {
    const container = this.tabs.pages[5]
    container
      .addInput(this.measurementsParams, 'enabled', {
        label: 'Enabled'
      })
      .on('change', () => {
        this.viewer.getExtension(SelectionExtension).enabled =
          !this.measurementsParams.enabled
        this.viewer.getExtension(MeasurementsExtension).enabled =
          this.measurementsParams.enabled
      })
    container
      .addInput(this.measurementsParams, 'visible', {
        label: 'Visible'
      })
      .on('change', () => {
        this.viewer.getExtension(MeasurementsExtension).options =
          this.measurementsParams
      })
    container
      .addInput(this.measurementsParams, 'type', {
        label: 'Type',
        options: {
          PERPENDICULAR: MeasurementType.PERPENDICULAR,
          POINTTOPOINT: MeasurementType.POINTTOPOINT
        }
      })
      .on('change', () => {
        this.viewer.getExtension(MeasurementsExtension).options =
          this.measurementsParams
      })
    container
      .addInput(this.measurementsParams, 'vertexSnap', {
        label: 'Snap'
      })
      .on('change', () => {
        this.viewer.getExtension(MeasurementsExtension).options =
          this.measurementsParams
      })

    container
      .addInput(this.measurementsParams, 'units', {
        label: 'Units',
        options: Units
      })
      .on('change', () => {
        this.viewer.getExtension(MeasurementsExtension).options =
          this.measurementsParams
      })
    container
      .addInput(this.measurementsParams, 'precision', {
        label: 'Precision',
        step: 1,
        min: 1,
        max: 5
      })
      .on('change', () => {
        this.viewer.getExtension(MeasurementsExtension).options =
          this.measurementsParams
      })
    container
      .addButton({
        title: 'Delete'
      })
      .on('click', () => {
        this.viewer.getExtension(MeasurementsExtension).removeMeasurement()
      })
    container
      .addButton({
        title: 'Delete All'
      })
      .on('click', () => {
        this.viewer.getExtension(MeasurementsExtension).clearMeasurements()
      })
  }

  private getBVHSize() {
    let size = 0
    const objects = this.viewer.getRenderer().allObjects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objects.traverse((obj: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (obj.hasOwnProperty('boundsTreeSizeInBytes')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        size += obj['boundsTreeSizeInBytes']
        // console.log(obj['boundsTreeSizeInBytes'] / 1024 / 1024)
      }
    })

    return size / 1024 / 1024
  }

  public async loadUrl(url: string) {
    const authToken = localStorage.getItem(
      url.includes('latest') ? 'AuthTokenLatest' : 'AuthToken'
    ) as string
    const objUrls = await UrlHelper.getResourceUrls(url, authToken)
    for (const url of objUrls) {
      console.log(`Loading ${url}`)
      const loader = new SpeckleLoader(
        this.viewer.getWorldTree(),
        url,
        authToken,
        true,
        undefined
      )
      /** Too spammy */
      // loader.on(LoaderEvent.LoadProgress, (arg: { progress: number; id: string }) => {
      //   console.warn(arg)
      // })
      loader.on(LoaderEvent.LoadCancelled, (resource: string) => {
        console.warn(`Resource ${resource} loading was canceled`)
      })
      loader.on(LoaderEvent.LoadWarning, (arg: { message: string }) => {
        console.error(`Loader warning: ${arg.message}`)
      })

      await this.viewer.loadObject(loader, true)
    }
    localStorage.setItem('last-load-url', url)
  }
}
