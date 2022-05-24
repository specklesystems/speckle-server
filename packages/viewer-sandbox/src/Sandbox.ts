import { Viewer, IViewer } from '@speckle/viewer'
import SpeckleLineMaterial from '@speckle/viewer/dist/modules/materials/SpeckleLineMaterial'
import { Object3D } from '@speckle/viewer/node_modules/@types/three'
import { Pane } from 'tweakpane'
import UrlHelper from './UrlHelper'
export default class Sandbox {
  private viewer: IViewer
  private pane: Pane
  private tabs: any

  public static urlParams = {
    url: 'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
  }

  public static sceneParams = {
    worldSize: {x: 0, y: 0, z: 0},
    worldOrigin: {x:0, y:0, z:0},
    useRTE: false,
    thickLines: true,
    pixelThreshold: 0.5,
    exposure: 0.4,
    tonemapping: 'Linear'
  }

  public constructor(viewer: Viewer) {
    this.viewer = viewer
    this.pane = new Pane({ title: 'Sandbox', expanded: true })
    this.pane['containerElem_'].style.width = "300px";
    const t = `matrix(1.2, 0, 0, 1.2, -25, 16)`
    this.pane['containerElem_'].style.transform = t;
    this.tabs = this.pane.addTab({
      pages: [
        {title: 'General'},
        {title: 'Scene'},
      ],
    });
    Sandbox.sceneParams.useRTE = viewer.RTE
    Sandbox.sceneParams.thickLines = viewer.thickLines;
  }

  public refresh() {
    this.pane.refresh();
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

    this.tabs.pages[0].addSeparator();
    
    const toggleSectionBox = this.tabs.pages[0].addButton({
      title: "Toggle Section Box"
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
  }

  makeSceneUI() {
    const worldFolder = this.tabs.pages[1].addFolder({
      title: "World",
      expanded: true
    });
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'x', {
      disabled: true,
      label: "Size-x",
      step: 0.00000001
    });
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'y', {
      disabled: true,
      label: "Size-y",
      step: 0.00000001
    });
    worldFolder.addInput(Sandbox.sceneParams.worldSize, 'z', {
      disabled: true,
      label: "Size-z",
      step: 0.00000001
    });
    worldFolder.addSeparator();
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'x', {
      disabled: true,
      label: "Origin-x"
    });
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'y', {
      disabled: true,
      label: "Origin-y"
    });
    worldFolder.addInput(Sandbox.sceneParams.worldOrigin, 'z', {
      disabled: true,
      label: "Origin-z"
    });

    worldFolder.addInput(Sandbox.sceneParams, 'useRTE', {
      label: "RTE"
    }).on('change', (ev: any) => {
      this.viewer.RTE = Sandbox.sceneParams.useRTE
    });

    worldFolder.addInput(Sandbox.sceneParams, 'thickLines', {
      label: "Thick Lines"
    }).on('change', (ev: any) => {
      this.viewer.thickLines = Sandbox.sceneParams.thickLines
    });

     worldFolder.addInput(Sandbox.sceneParams, 'pixelThreshold', {
      min: 0,
      max: 5,
    }).on('change', (ev: any) => {
      this.viewer.scene.traverse((object: Object3D) => {
        if(object.type == "Line2"){
          //@ts-ignore
          (object.material as SpeckleLineMaterial).pixelThreshold = Sandbox.sceneParams.pixelThreshold;
        }
      })
    });

    this.tabs.pages[1].addSeparator();
    const postFolder = this.tabs.pages[1].addFolder({
      title: "Post",
      expanded: true
    });

    postFolder.addInput(Sandbox.sceneParams, 'exposure', {
      min: 0,
      max: 1,
    }).on('change', (ev: any) => {
      this.viewer.renderer.toneMappingExposure = Sandbox.sceneParams.exposure;
    });

    postFolder.addInput(Sandbox.sceneParams, 'tonemapping', {
      options: {
          Linear: 1,
          ACES: 4
      }
    }).on('change', (ev: any) => {
        this.viewer.renderer.toneMapping = Sandbox.sceneParams.tonemapping
    });

    
  }

  public async loadUrl(url: string) {
    const objUrls = await UrlHelper.getResourceUrls(url)
    for (const url of objUrls) {
      console.log(`Loading ${url}`)
      await this.viewer.loadObject(url)
    }
    localStorage.setItem('last-load-url', url)
  }
}
