import {
  CanonicalView,
  DebugViewer,
  PropertyInfo,
  SelectionEvent,
  SunLightConfiguration,
  ViewerEvent
} from '@speckle/viewer'
import { FolderApi, Pane } from 'tweakpane'
import UrlHelper from './UrlHelper'

export default class Sandbox {
  private viewer: DebugViewer
  private pane: Pane
  private tabs
  private viewsFolder!: FolderApi
  private streams: { [url: string]: Array<unknown> } = {}
  private properties: PropertyInfo[]
  private selectionList: SelectionEvent[]

  public static urlParams = {
    url: 'https://latest.speckle.dev/streams/c43ac05d04/commits/ec724cfbeb'
  }

  public static sceneParams = {
    worldSize: { x: 0, y: 0, z: 0 },
    worldOrigin: { x: 0, y: 0, z: 0 },
    pixelThreshold: 0.5,
    exposure: 0.5,
    tonemapping: 4 //'ACESFilmicToneMapping'
  }

  public static pipelineParams = {
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
  }

  public static lightParams: SunLightConfiguration = {
    enabled: true,
    castShadow: true,
    intensity: 5,
    color: 0xffffff,
    azimuth: 0.75,
    elevation: 1.33,
    radius: 0,
    indirectLightIntensity: 1.2
  }

  public static filterParams = {
    filterBy: 'Volume'
  }

  public constructor(viewer: DebugViewer, selectionList: SelectionEvent[]) {
    this.viewer = viewer
    this.selectionList = selectionList
    this.pane = new Pane({ title: 'Speckle Sandbox', expanded: true })
    this.pane['containerElem_'].style =
      'position:fixed; top: 5px; right: 5px; width: 300px;'

    this.tabs = this.pane.addTab({
      pages: [{ title: 'General' }, { title: 'Scene' }, { title: 'Filtering' }]
    })
    this.properties = []

    viewer.on(ViewerEvent.LoadComplete, (url: string) => {
      this.addStreamControls(url)
      this.addViewControls()
      this.properties = this.viewer.getObjectProperties()
      // const dataTree = this.viewer.getDataTree()
      // const objects = dataTree.findAll((guid, obj) => {
      //   return obj.speckle_type === 'Objects.Geometry.Mesh'
      // })
      // console.log(objects)
    })
    viewer.on(ViewerEvent.UnloadComplete, (url: string) => {
      this.removeViewControls()
      this.addViewControls()
      this.properties = this.viewer.getObjectProperties()
      url
    })
    viewer.on(ViewerEvent.UnloadAllComplete, (url: string) => {
      this.removeViewControls()
      this.addViewControls()
      this.properties = this.viewer.getObjectProperties()
      url
    })
  }

  public refresh() {
    this.pane.refresh()
  }

  private addStreamControls(url: string) {
    const folder = this.pane.addFolder({
      title: `Object: ${url.split('/').reverse()[0]}`
    })

    folder.addInput({ url }, 'url', {
      title: 'URL',
      disabled: true
    })
    const position = { value: { x: 0, y: 0, z: 0 } }
    folder.addInput(position, 'value', { label: 'Position' }).on('change', () => {
      this.viewer
        .getRenderer()
        .subtree(url)
        .position.set(position.value.x, position.value.y, position.value.z)
      this.viewer.getRenderer().updateDirectLights()
      this.viewer.getRenderer().updateHelpers()
      this.viewer.requestRender()
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
    this.viewer.unloadObject(url)
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
      this.viewsFolder
        .addButton({
          title: views[k].name
        })
        .on('click', () => {
          this.viewer.setView(views[k], true)
        })
    }
  }

  private removeViewControls() {
    this.viewsFolder.dispose()
  }

  public makeGenericUI() {
    this.tabs.pages[0].addInput(Sandbox.urlParams, 'url', {
      title: 'url'
    })

    const loadButton = this.tabs.pages[0].addButton({
      title: 'Load Url'
    })

    loadButton.on('click', () => {
      this.loadUrl(Sandbox.urlParams.url)
    })

    const clearButton = this.tabs.pages[0].addButton({
      title: 'Clear All'
    })

    clearButton.on('click', () => {
      this.viewer.unloadAll()
    })

    this.tabs.pages[0].addSeparator()
    this.tabs.pages[0].addSeparator()

    const toggleSectionBox = this.tabs.pages[0].addButton({
      title: 'Toggle Section Box'
    })
    toggleSectionBox.on('click', () => {
      this.viewer.setSectionBoxFromObjects(
        this.selectionList.map((val) => val.hits[0].object.id) as string[]
      )
      this.viewer.toggleSectionBox()
    })

    const toggleProjection = this.tabs.pages[0].addButton({
      title: 'Toggle Projection'
    })
    toggleProjection.on('click', () => {
      this.viewer.toggleCameraProjection()
    })

    const zoomExtents = this.tabs.pages[0].addButton({
      title: 'Zoom Extents'
    })
    zoomExtents.on('click', () => {
      this.viewer.zoom(
        this.selectionList.map((val) => val.hits[0].object.id) as string[],
        undefined,
        true
      )
    })

    this.tabs.pages[0].addSeparator()
    this.tabs.pages[0].addSeparator()

    const showBatches = this.tabs.pages[0].addButton({
      title: 'ShowBatches'
    })
    showBatches.on('click', () => {
      this.viewer.getRenderer().debugShowBatches()
      this.viewer.requestRender()
    })

    const darkModeToggle = this.tabs.pages[0].addButton({
      title: '🌞 / 🌛'
    })
    const dark = localStorage.getItem('dark') === 'dark'
    if (dark) {
      document.getElementById('renderer')?.classList.toggle('background-dark')
    }

    darkModeToggle.on('click', () => {
      const dark = document
        .getElementById('renderer')
        ?.classList.toggle('background-dark')

      localStorage.setItem('dark', dark ? `dark` : `light`)
    })

    const screenshot = this.tabs.pages[0].addButton({
      title: 'Screenshot'
    })
    screenshot.on('click', async () => {
      // console.warn(await this.viewer.screenshot())
      this.viewer.hideObjects(
        [
          'd0c1da9ee6dca24b2ce5a0dcac929bba',
          '2d5b8a02dddde15c5d88e0f5adb26d90',
          '3c086d63f9ec8eef67b4071f260a31dc',
          '933e292e7c55dd083ddd80e3d4264fb5',
          '33871108c2e6ee2deaf09226e191e389',
          '34acd00132c576c9ccec05326db005a0',
          'ca7f371344c14130b4977910de457177',
          '8a15ebff809996b4a54a9671674f9d82',
          '9f181b38ec42e6aac2243d93d17f6290',
          '90850bb5900b04a0ad3f2a0fc00b9dea',
          '77c8f48d287e0a39485ea5d0e25e0760',
          '2ec6b19932d70434c73c4b217a544cb9',
          'd78420715aef45dce9dd5d9df2efb9fd',
          '80e59e3301f1ed7a59917636d8368eab',
          '9f62d5a7c639260cd526ddd427086d31',
          'bd1ccc42212a9aaac803ac72b35e53de',
          'df01935c34b0b34f60e41376763000b4',
          'e41e6310c00d53305346e7c863b16076',
          'aeb8541e59717d7f7b985be1bd9d3c2c',
          '154054257f2094a46129fdb09fc202d2',
          '7c99e3828a96fbd5ea794c9996517c49',
          'f6f0fbb1177d6790ce5fccf460e82142',
          '0a61a2e378b1ac64751e25dc8a30f2a5',
          'cc72f04be66aa3bf01f137e056658c39',
          '3c1b7f96454a20e12a084f9b72a7eb9a',
          '18a368993923f3b08b5be886252d799d',
          '1b633a9b4c57f04c9509ea5fa4fa9bea',
          '7419c6ae4cda06de6754d70ea5d1f00b',
          'ed7975192c92ec08475abb1f00d6c1a3',
          '06d3eb307c93fe26305a9dc6686275d2',
          '40c1b3170bf4254d96c75abe30334102',
          '6272b36762238e93bcd90a998d745a5c',
          '9aa660351afe6a8da7a2141deb0ca0dc',
          '2c726a1513c67a6916c370f136cbb5d7',
          '129aaf383e1a0e5c5bc282d84e98d025',
          '8d26df55f42f0a7bffba76935379111c',
          '5908ba1aec898bbd5a3af455bbafedf1',
          'f841cd136609a572a9547ff5f993d892',
          '0bca01e0b4b33e151f832b820d140a49',
          '004dd8fcd4cc059d805bf9ba32140158',
          '264b09a99191fb9b26a4f1d018170ae9',
          '2b82d0d17d419402f06f148cbadbe27b',
          'a511137a7997b7d049f3a6205d5c6067',
          'c73988b267632b0643003c24c957fc7f',
          '22be75a1b272605c922f8214356e777a',
          '6960442387221968072d9e1d7ff6dd17',
          '9b13c9236459b0961f9f078dce802585',
          '5165d828b6546a342862644332a629ea',
          'e794f07cdafffdce83b7466b39055e3b',
          '71c514a012f0dea6959f8831a12a7e2b',
          '6a4d6ec7e1ab4c9de49328e261cd5cce',
          'afd0d559f53048e207b2ee0414daa4c2',
          'a15ce6a9ab7211c3f080039b58c026c9',
          'e2e77f23f0f3bfadd124577f5195f74b',
          '0e55912cffcab3871a0d3c8fd66ac8c9',
          'c2e29dabb928d8b0f17ab454040c7bca',
          'be39301ebb6eb7b382530b1ab301d924',
          '14f91d947a9c9ac921abbff008d0bf69',
          'cbdaf984d11e039c0c16e1661b000002',
          '1d21b5d3e8573a6aec196d54bbacdd36',
          '3fc9117a2b10af66b62fc20a0d1746cd',
          '824bc34ae86317c9b7e216dbe543bdf1',
          'ea338b1ef4518e00d424bd8060a612de',
          '4aaff96888e14e30268b8befb99cd32a',
          'da5fd648bf1d096660b1093ae9943a0c',
          'a0c730d9ce179ce66bfe469eec0d7ce2',
          '69d5cde7e59dc66c5bf5469942dfbcb8',
          '720465b8343ea257a9b31094f30d79e5',
          'e63494bd4b5687e6067a02708584ca39',
          'bb34922b2162e979ba0a9bb212c869b8',
          '2ef029249422b0fe24859094b0bada40',
          '30358584b2bbf6b9bc2fecad361ee310',
          '67e4495051bf3e6b7915763bb26e64cd',
          '60b59b8586308098284ed3e02c041dd6',
          '56dbaf612bfc7a87595cc1f6eb7df349',
          'cdb5ce431d4b5cfd7cd2c567f3248117',
          'd135a886b6f7dbbda642a5ba00ed5246',
          '299dba6eb18d74ab9a5611acbb691ab3',
          '426fcd488d42cf2788eace0178b2316d',
          '1afdfb290bd8dc1061eeb30d8dadcb20',
          '81c706e841718c6fbd7cd7ae54e60826',
          'fd447c87ca5bdf39c624056ef1e0e6ad',
          'bd067857e20be63391b42f57e8f47dac',
          'f4e6a5b8ee37066638514f9e6b801558',
          '1f1b413799b5e1a86bd44d98d37985dc',
          'c18d318764aba688743171ea5ce0f715',
          '5a1464ed66785b3db7fee16516a72e0c',
          '5ea1957470434d024a7c429c0397e35f',
          'd7f72f0b7e4d26ce4b37638d88ed41ab',
          '28cebf87f08efa15223a012f55ba3ee6',
          '8f4e916a68eb86c84ce2746f426af9d2'
        ],
        'ui-vis',
        false
      )
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
        this.viewer.setView({ azimuth: Math.PI / 12, polar: 0 }, false)
        this.viewer.getRenderer().resetPipeline(true)
        await waitForAnimation(1000)
      }
    })

    const canonicalViewsFolder = this.tabs.pages[0].addFolder({
      title: 'Canonical Views',
      expanded: true
    })
    const sides = ['front', 'back', 'top', 'bottom', 'right', 'left', '3d']
    for (let k = 0; k < sides.length; k++) {
      canonicalViewsFolder
        .addButton({
          title: sides[k]
        })
        .on('click', () => {
          this.viewer.setView(sides[k] as CanonicalView)
        })
    }
  }

  makeSceneUI() {
    const worldFolder = this.tabs.pages[1].addFolder({
      title: 'World',
      expanded: true
    })
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'x', {
      disabled: true,
      label: 'Size-x',
      step: 0.00000001
    })
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'y', {
      disabled: true,
      label: 'Size-y',
      step: 0.00000001
    })
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'z', {
      disabled: true,
      label: 'Size-z',
      step: 0.00000001
    })
    worldFolder.addSeparator()
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'x', {
      disabled: true,
      label: 'Origin-x'
    })
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'y', {
      disabled: true,
      label: 'Origin-y'
    })
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'z', {
      disabled: true,
      label: 'Origin-z'
    })

    this.tabs.pages[1].addSeparator()
    const postFolder = this.tabs.pages[1].addFolder({
      title: 'Post',
      expanded: true
    })

    postFolder
      .addInput(Sandbox.sceneParams, 'exposure', {
        min: 0,
        max: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().renderer.toneMappingExposure =
          Sandbox.sceneParams.exposure
        this.viewer.requestRender()
      })

    postFolder
      .addInput({ near: 0.01 }, 'near', {
        min: 0,
        max: 2,
        step: 0.001
      })
      .on('change', (ev) => {
        this.viewer.cameraHandler.activeCam.camera.near = ev.value
        this.viewer.cameraHandler.activeCam.camera.updateProjectionMatrix()
        this.viewer.requestRender()
      })

    postFolder
      .addInput({ far: 10 }, 'far', {
        min: 0,
        max: 10000,
        step: 1
      })
      .on('change', (ev) => {
        this.viewer.cameraHandler.activeCam.camera.far = ev.value
        this.viewer.cameraHandler.activeCam.camera.updateProjectionMatrix()
        this.viewer.requestRender()
      })

    postFolder
      .addInput(Sandbox.sceneParams, 'tonemapping', {
        options: {
          Linear: 1,
          ACES: 4
        }
      })
      .on('change', () => {
        this.viewer.getRenderer().renderer.toneMapping = Sandbox.sceneParams.tonemapping
        this.viewer.requestRender()
      })

    const pipelineFolder = this.tabs.pages[1].addFolder({
      title: 'Pipeline',
      expanded: true
    })
    pipelineFolder
      .addInput(Sandbox.pipelineParams, 'pipelineOutput', {
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
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    pipelineFolder
      .addInput(Sandbox.pipelineParams, 'accumulationFrames', {
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    const dynamicAoFolder = pipelineFolder.addFolder({
      title: 'Dynamic AO',
      expanded: true
    })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'intensity', { min: 0, max: 5 })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'kernelRadius', {
        min: 0,
        max: 500
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'bias', {
        min: -1,
        max: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })
    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'normalsType', {
        options: {
          DEFAULT: 0,
          ADVANCED: 1,
          ACCURATE: 2
        }
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'blurEnabled', {})
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'blurRadius', {
        min: 0,
        max: 10
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    dynamicAoFolder
      .addInput(Sandbox.pipelineParams.dynamicAoParams, 'blurDepthCutoff', {
        min: 0,
        max: 1,
        step: 0.00001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    const staticAoFolder = pipelineFolder.addFolder({
      title: 'Static AO',
      expanded: true
    })
    // staticAoFolder
    //   .addInput(Sandbox.pipelineParams, 'staticAoEnabled', {})
    //   .on('change', () => {
    //     this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
    //     this.viewer.requestRender()
    //   })
    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'intensity', {
        min: 0,
        max: 5,
        step: 0.01
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })
    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'minDistance', {
        min: 0,
        max: 100,
        step: 0.000001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'maxDistance', {
        min: 0,
        max: 100,
        step: 0.000001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })
    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'kernelRadius', {
        min: 0,
        max: 1000
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'bias', {
        min: -1,
        max: 1,
        step: 0.0001
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    staticAoFolder
      .addInput(Sandbox.pipelineParams.staticAoParams, 'kernelSize', {
        min: 1,
        max: 128,
        step: 1
      })
      .on('change', () => {
        this.viewer.getRenderer().pipelineOptions = Sandbox.pipelineParams
        this.viewer.requestRender()
      })

    const lightsFolder = this.tabs.pages[1].addFolder({
      title: 'Lights',
      expanded: true
    })
    const directLightFolder = lightsFolder.addFolder({
      title: 'Direct',
      expanded: true
    })
    directLightFolder
      .addInput(Sandbox.lightParams, 'enabled', {
        label: 'Sun Enabled'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'castShadow', {
        label: 'Sun Shadows'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'intensity', {
        label: 'Sun Intensity',
        min: 0,
        max: 10
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'color', {
        view: 'color',
        label: 'Sun Color'
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'elevation', {
        label: 'Sun Elevation',
        min: 0,
        max: Math.PI
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'azimuth', {
        label: 'Sun Azimuth',
        min: -Math.PI * 0.5,
        max: Math.PI * 0.5
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
    directLightFolder
      .addInput(Sandbox.lightParams, 'radius', {
        label: 'Sun Radius',
        min: 0,
        max: 1000
      })
      .on('change', () => {
        this.viewer.setLightConfiguration(Sandbox.lightParams)
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
        this.viewer.requestRenderShadowmap()
        this.viewer.requestRender()
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
        this.viewer.requestRenderShadowmap()
        this.viewer.requestRender()
      })

    const indirectLightsFolder = lightsFolder.addFolder({
      title: 'Indirect',
      expanded: true
    })

    indirectLightsFolder
      .addInput(Sandbox.lightParams, 'indirectLightIntensity', {
        label: 'Probe Intensity',
        min: 0,
        max: 10
      })
      .on('change', (value) => {
        value
        this.viewer.setLightConfiguration(Sandbox.lightParams)
      })
  }

  makeFilteringUI() {
    const filteringFolder = this.tabs.pages[2].addFolder({
      title: 'Filtering',
      expanded: true
    })

    filteringFolder.addInput(Sandbox.filterParams, 'filterBy', {
      options: {
        Volume: 'parameters.HOST_VOLUME_COMPUTED.value',
        Area: 'parameters.HOST_AREA_COMPUTED.value',
        SpeckleType: 'speckle_type'
      }
    })

    filteringFolder
      .addButton({
        title: 'Apply Filter'
      })
      .on('click', () => {
        const data = this.properties.find((value) => {
          return value.key === Sandbox.filterParams.filterBy
        }) as PropertyInfo
        this.viewer.setColorFilter(data)
        this.pane.refresh()
      })

    filteringFolder
      .addButton({
        title: 'Clear Filters'
      })
      .on('click', () => {
        this.viewer.resetFilters()
      })
  }

  public async loadUrl(url: string) {
    const objUrls = await UrlHelper.getResourceUrls(url)
    for (const url of objUrls) {
      console.log(`Loading ${url}`)
      const authToken = localStorage.getItem(
        url.includes('latest') ? 'AuthTokenLatest' : 'AuthToken'
      ) as string
      await this.viewer.loadObject(url, authToken)
    }
    localStorage.setItem('last-load-url', url)
  }
}
