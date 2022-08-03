import { SpeckleType } from '@speckle/viewer'
import { GeometryConverter } from '@speckle/viewer'
import { Viewer, WorldTree } from '@speckle/viewer'
import { Pane } from 'tweakpane'
import UrlHelper from './UrlHelper'

export default class Sandbox {
  private viewer: Viewer
  private pane: Pane
  private tabs
  private filterControls
  private steamsFolder
  private streams: { [url: string]: Array<unknown> } = {}

  public static urlParams = {
    url: 'https://latest.speckle.dev/streams/c43ac05d04/commits/ec724cfbeb'
  }

  public static sceneParams = {
    worldSize: { x: 0, y: 0, z: 0 },
    worldOrigin: { x: 0, y: 0, z: 0 },
    pixelThreshold: 0.5,
    exposure: 0.5,
    tonemapping: 'ACESFilmicToneMapping',
    sunPhi: 0.5,
    sunTheta: 0.5,
    sunRadiusOffset: 0
  }

  public static filterParams = {
    filterBy: 'Volume',
    numericProperty: true,
    data: {},
    minValue: 0,
    maxValue: 10000
  }

  public constructor(viewer: Viewer) {
    this.viewer = viewer
    this.pane = new Pane({ title: 'Sandbox', expanded: true })
    this.pane['containerElem_'].style.width = '300px'
    const t = `matrix(1.2, 0, 0, 1.2, -25, 16)`
    this.pane['containerElem_'].style.transform = t
    this.tabs = this.pane.addTab({
      pages: [{ title: 'General' }, { title: 'Scene' }, { title: 'Filtering' }]
    })

    viewer.on('load-complete', (url: string) => {
      this.addStreamControls(url)
    })
  }

  public refresh() {
    this.pane.refresh()
  }

  private addStreamControls(url: string) {
    const label = this.steamsFolder.addInput({ url }, 'url', {
      title: 'URL',
      disabled: true
    })
    const button = this.steamsFolder
      .addButton({
        title: 'Unload'
      })
      .on('click', () => {
        this.removeStreamControls(url)
      })
    this.streams[url] = []
    this.streams[url].push(label, button)
  }

  private removeStreamControls(url: string) {
    this.viewer.unloadObject(url)
    ;(this.streams[url][0] as { dispose: () => void }).dispose()
    ;(this.streams[url][1] as { dispose: () => void }).dispose()
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

    this.steamsFolder = this.tabs.pages[0].addFolder({
      title: 'Active Streams',
      expanded: true
    })

    this.tabs.pages[0].addSeparator()

    const toggleSectionBox = this.tabs.pages[0].addButton({
      title: 'Toggle Section Box'
    })
    toggleSectionBox.on('click', () => {
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
      this.viewer.zoomExtents(undefined, true)
    })

    this.tabs.pages[0].addSeparator()
    this.tabs.pages[0].addSeparator()

    const showBatches = this.tabs.pages[0].addButton({
      title: 'ShowBatches'
    })
    showBatches.on('click', () => {
      this.viewer.speckleRenderer.debugShowBatches()
    })
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

    // worldFolder
    //   .addInput(Sandbox.sceneParams, 'pixelThreshold', {
    //     min: 0,
    //     max: 5
    //   })
    //   .on('change', () => {
    //     this.viewer.scene.traverse((object: Object3D) => {
    //       if (object.type === 'Line2') {
    //         ;(object.material as SpeckleLineMaterial).pixelThreshold =
    //           Sandbox.sceneParams.pixelThreshold
    //       }
    //     })
    //   })

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
        this.viewer.speckleRenderer.renderer.toneMappingExposure =
          Sandbox.sceneParams.exposure
      })

    postFolder
      .addInput(Sandbox.sceneParams, 'tonemapping', {
        options: {
          Linear: 1,
          ACES: 4
        }
      })
      .on('change', () => {
        this.viewer.speckleRenderer.renderer.toneMapping =
          Sandbox.sceneParams.tonemapping
      })

    const lightsFolder = this.tabs.pages[1].addFolder({
      title: 'Lights',
      expanded: true
    })
    lightsFolder
      .addInput(Sandbox.sceneParams, 'sunPhi', {
        min: 0,
        max: Math.PI
      })
      .on('change', () => {
        this.viewer.speckleRenderer.updateDirectLights(
          Sandbox.sceneParams.sunPhi,
          Sandbox.sceneParams.sunTheta,
          Sandbox.sceneParams.sunRadiusOffset
        )
      })
    lightsFolder
      .addInput(Sandbox.sceneParams, 'sunTheta', {
        min: -Math.PI * 0.5,
        max: Math.PI * 0.5
      })
      .on('change', () => {
        this.viewer.speckleRenderer.updateDirectLights(
          Sandbox.sceneParams.sunPhi,
          Sandbox.sceneParams.sunTheta,
          Sandbox.sceneParams.sunRadiusOffset
        )
      })
  }

  makeFilteringUI() {
    const filteringFolder = this.tabs.pages[2].addFolder({
      title: 'Filtering',
      expanded: true
    })

    filteringFolder
      .addInput(Sandbox.filterParams, 'filterBy', {
        options: {
          Volume: 'Volume',
          Area: 'Area',
          SpeckleType: 'speckle_type'
        }
      })
      .on('change', () => {
        switch (Sandbox.filterParams.filterBy) {
          case 'Volume':
          case 'Area':
            Sandbox.filterParams.numericProperty = true
            break

          case 'speckle_type':
            Sandbox.filterParams.numericProperty = false
        }
      })

    filteringFolder
      .addButton({
        title: 'Apply Filter'
      })
      .on('click', () => {
        if (Sandbox.filterParams.numericProperty) {
          Sandbox.filterParams.data = this.viewer.debugGetFilterByNumericPropetyData(
            Sandbox.filterParams.filterBy
          )
          Sandbox.filterParams.minValue = Sandbox.filterParams.data.min
          Sandbox.filterParams.maxValue = Sandbox.filterParams.data.max
          this.viewer.debugApplyByNumericPropetyFilter(
            Sandbox.filterParams.data,
            Sandbox.filterParams.filterBy
          )

          if (this.filterControls) this.filterControls.dispose()
          this.filterControls = this.tabs.pages[2].addFolder({
            title: 'Filter Options',
            expanded: true
          })

          this.filterControls
            .addInput(Sandbox.filterParams, 'minValue', {
              min: Sandbox.filterParams.minValue,
              max: Sandbox.filterParams.maxValue
            })
            .on('change', () => {
              this.viewer.debugApplyByNumericPropetyFilter(
                Sandbox.filterParams.data,
                Sandbox.filterParams.filterBy,
                Sandbox.filterParams.minValue,
                Sandbox.filterParams.maxValue
              )
            })
          this.filterControls
            .addInput(Sandbox.filterParams, 'maxValue', {
              min: Sandbox.filterParams.minValue,
              max: Sandbox.filterParams.maxValue
            })
            .on('change', () => {
              this.viewer.debugApplyByNumericPropetyFilter(
                Sandbox.filterParams.data,
                Sandbox.filterParams.filterBy,
                Sandbox.filterParams.minValue,
                Sandbox.filterParams.maxValue
              )
            })
        } else {
          Sandbox.filterParams.data = this.viewer.debugGetFilterByNonNumericPropetyData(
            Sandbox.filterParams.filterBy
          )
          this.viewer.debugApplyByNonNumericPropetyFilter(Sandbox.filterParams.data)
          if (this.filterControls) this.filterControls.dispose()
          this.filterControls = this.tabs.pages[2].addFolder({
            title: 'Filter Options',
            expanded: true
          })
          const categories = Object.values(Sandbox.filterParams.data)
          categories.forEach((category) => {
            this.filterControls
              .addInput(category, 'color', {
                view: 'color',
                label: category.name
              })
              .on('change', () => {
                this.viewer.debugApplyByNonNumericPropetyFilter(
                  Sandbox.filterParams.data
                )
              })
          })
        }

        this.pane.refresh()
      })
  }

  public async loadUrl(url: string) {
    const objUrls = await UrlHelper.getResourceUrls(url)
    for (const url of objUrls) {
      console.log(`Loading ${url}`)
      const authToken = localStorage.getItem(
        url.includes('latest') ? 'AuthTokenLatest' : 'AuthToken'
      )
      await this.viewer.loadObject(url, authToken)
    }
    localStorage.setItem('last-load-url', url)
  }

  private getRandomNodeIds(chance: number): string[] {
    const res: string[] = []
    WorldTree.getInstance().walk(
      (node: {
        [x: string]: unknown
        model: {
          renderView: { hasGeometry: unknown }
          atomic: unknown
          children: string | unknown[]
          id: string
        }
      }) => {
        if (
          node.model.renderView !== null &&
          GeometryConverter.getSpeckleType(node.model) in SpeckleType &&
          (node.model.atomic ||
            (node.parent.model.atomic && !node.parent.model.renderView?.hasGeometry))
        ) {
          const _try = Math.random()
          if (_try < chance) {
            res.push(node.model.id)
          }
        }
        return true
      }
    )
    return res
  }
}
