import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'

import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import InteractionHandler from './legacy/InteractionHandler'
import CameraHandler from './context/CameraHanlder'

import SectionBox from './SectionBox'
import { Clock, Color, MathUtils, Texture, Vector3 } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import {
  DefaultViewerParams,
  IViewer,
  LightConfiguration,
  SunLightConfiguration,
  ViewerParams
} from '../IViewer'
import { World } from './World'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'
import { FilterMaterialType, FilteringManager } from './filtering/FilteringManager'
import { PropertyManager } from './filtering/PropertyManager'
import { SpeckleType } from './converter/GeometryConverter'

export class Viewer extends EventEmitter implements IViewer {
  public speckleRenderer: SpeckleRenderer
  private clock: Clock
  private container: HTMLElement
  private stats: Optional<Stats>
  private loaders: { [id: string]: ViewerObjectLoader } = {}
  private _needsRender: boolean
  private inProgressOperations: number

  public sectionBox: SectionBox
  public interactions: InteractionHandler
  public cameraHandler: CameraHandler
  private startupParams: ViewerParams

  public static Assets: Assets

  public FilteringManager: FilteringManager

  public get needsRender(): boolean {
    return this._needsRender
  }

  public set needsRender(value: boolean) {
    this._needsRender = value || this._needsRender
  }

  private _worldOrigin: Vector3 = new Vector3()
  public get worldSize() {
    World.worldBox.getCenter(this._worldOrigin)
    const size = new Vector3().subVectors(World.worldBox.max, World.worldBox.min)
    return {
      x: size.x,
      y: size.y,
      z: size.z
    }
  }

  public get worldOrigin() {
    return this._worldOrigin
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()

    window.THREE = THREE // Do we really need this?
    this.startupParams = params
    this.clock = new THREE.Clock()

    this.container = container || document.getElementById('renderer')

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    new Assets(this.speckleRenderer.renderer)

    this.cameraHandler = new CameraHandler(this)

    if (params.showStats) {
      this.stats = Stats()
      this.container.appendChild(this.stats.dom)
    }

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    this.loaders = {}

    this.sectionBox = new SectionBox(this)
    this.sectionBox.off()
    this.sectionBox.controls.addEventListener('change', () => {
      this.speckleRenderer.updateClippingPlanes(this.sectionBox.planes)
    })

    this.interactions = new InteractionHandler(this)

    this.frame()
    this.onWindowResize()
    this.needsRender = true

    this.inProgressOperations = 0

    this.on('load-complete', (url) => {
      WorldTree.getRenderTree(url).buildRenderTree()
      this.speckleRenderer.addRenderTree(url)
      this.zoomExtents()
    })

    this.FilteringManager = new FilteringManager(this.speckleRenderer)
    ;(window as any).WT = WorldTree
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).FM = this.FilteringManager
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).V = this
  }

  public async init(): Promise<void> {
    if (this.startupParams.environmentSrc) {
      Assets.getEnvironment(this.startupParams.environmentSrc)
        .then((value: Texture) => {
          this.speckleRenderer.indirectIBL = value
        })
        .catch((reason) => {
          console.warn(reason)
          console.warn('Fallback to null environment!')
        })
    }
  }

  private onWindowResize() {
    this.speckleRenderer.renderer.setSize(
      this.container.offsetWidth,
      this.container.offsetHeight
    )
    this.needsRender = true
  }

  private frame() {
    this.update()
    this.render()
  }

  private update() {
    const delta = this.clock.getDelta()
    this.needsRender = this.cameraHandler.controls.update(delta)
    this.speckleRenderer.update(delta)
    this.stats?.update()
    requestAnimationFrame(this.frame.bind(this))
  }

  private render() {
    if (this.needsRender) {
      this.speckleRenderer.render(this.cameraHandler.activeCam.camera)
    }
  }

  public toggleSectionBox() {
    this.sectionBox.toggle()
  }

  public sectionBoxOff() {
    this.sectionBox.off()
  }

  public sectionBoxOn() {
    this.sectionBox.on()
  }

  public zoomExtents(fit?: number, transition?: boolean) {
    this.speckleRenderer.zoomExtents(fit, transition)
  }

  public setProjectionMode(mode: typeof CameraHandler.prototype.activeCam) {
    this.cameraHandler.activeCam = mode
  }

  public toggleCameraProjection() {
    this.cameraHandler.toggleCameras()
  }

  public setLightConfiguration(config: LightConfiguration): void {
    this.speckleRenderer.setSunLightConfiguration(config as SunLightConfiguration)
  }

  public getViews() {
    return WorldTree.getInstance()
      .findAll((node: TreeNode) => {
        return node.model.renderView?.speckleType === SpeckleType.View3D
      })
      .map((v) => {
        return {
          name: v.model.raw.applicationId,
          id: v.model.id,
          view: v.model.raw
        }
      })
  }

  public setView(id: string, transition: boolean): void {
    const view3DNode = WorldTree.getInstance().findId(id)
    this.speckleRenderer.setView(
      view3DNode.model.raw.origin,
      view3DNode.model.raw.target,
      transition
    )
  }

  public rotateTo(side: string, transition = true) {
    this.speckleRenderer.rotateTo(side, transition)
  }

  public screenshot(): Promise<string> {
    return new Promise((resolve) => {
      const sectionBoxVisible = this.sectionBox.display.visible
      if (sectionBoxVisible) {
        this.sectionBox.displayOff()
      }
      const screenshot = this.speckleRenderer.renderer.domElement.toDataURL('image/png')
      if (sectionBoxVisible) {
        this.sectionBox.displayOn()
      }
      resolve(screenshot)
    })
  }

  public async loadObject(url: string, token?: string, enableCaching = true) {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)

      const loader = new ViewerObjectLoader(this, url, token, enableCaching)
      this.loaders[url] = loader
      await loader.load()
    } finally {
      if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    }
  }

  public async cancelLoad(url: string, unload = false) {
    this.loaders[url].cancelLoad()
    if (unload) {
      await this.unloadObject(url)
    }
    return
  }

  public async unloadObject(url: string) {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)
      delete this.loaders[url]
      this.speckleRenderer.removeRenderTree(url)
      WorldTree.getRenderTree(url).purge()
      WorldTree.getInstance().purge(url)
    } finally {
      if (--this.inProgressOperations === 0) {
        ;(this as EventEmitter).emit('busy', false)
        console.warn(`Removed subtree ${url}`)
        ;(this as EventEmitter).emit('unload-complete', url)
      }
    }
  }

  public async unloadAll() {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)
      for (const key of Object.keys(this.loaders)) {
        delete this.loaders[key]
      }
      this.FilteringManager.reset()
      WorldTree.getInstance().root.children.forEach((node) => {
        this.speckleRenderer.removeRenderTree(node.model.id)
        WorldTree.getRenderTree().purge()
      })

      WorldTree.getInstance().purge()
    } finally {
      if (--this.inProgressOperations === 0) {
        ;(this as EventEmitter).emit('busy', false)
        console.warn(`Removed all subtrees`)
        ;(this as EventEmitter).emit('unload-all-complete')
      }
    }
  }

  /**
   * LEGACY: Handles (or tries to handle) old viewer filtering.
   * @param args legacy filter object
   */
  public async applyFilter(filter: any) {
    // return this.FilteringManager.handleLegacyFilter(filter)
  }

  /**
   * Legacy: use FilteringManager.getAllPropertyFilters()
   * @returns
   */
  public getObjectsProperties = () => PropertyManager.getProperties()

  public debugGetFilterByNumericPropetyData(propertyName: string): {
    min: number
    max: number
    nodes: TreeNode[]
  } {
    const volumeNodes = []
    let min = Infinity
    let max = 0
    WorldTree.getInstance().walk((node: TreeNode) => {
      const params = node.model.raw.parameters
      if (params) {
        for (const k in params) {
          if (!(params[k] instanceof Object)) continue
          if (params[k].name === propertyName) {
            min = Math.min(min, params[k].value)
            max = Math.max(max, params[k].value)
            volumeNodes.push(node)
          }
        }
      }
      return true
    })

    return {
      min,
      max,
      nodes: volumeNodes
    }
  }

  public debugApplyByNumericPropetyFilter(
    data: { min: number; max: number; nodes: TreeNode[] },
    propertyName: string,
    min?: number,
    max?: number
  ) {
    const start = performance.now()
    const nodesGradient = []
    const nodesGhost = []
    const values = []

    /** This is the lazy approach */
    WorldTree.getInstance().walk((node: TreeNode) => {
      const params = node.model.raw.parameters
      if (params) {
        for (const k in params) {
          if (!(params[k] instanceof Object)) continue
          if (params[k].name === propertyName) {
            const propertyValue = params[k].value
            const passMin = min !== undefined ? propertyValue >= min : true
            const passMax = max !== undefined ? propertyValue <= max : true
            if (
              data.nodes.includes(node) &&
              passMin &&
              passMax &&
              !nodesGradient.includes(node)
            ) {
              nodesGradient.push(node)
              values.push(propertyValue)
            }
          } else {
            if (!nodesGhost.includes(node)) nodesGhost.push(node)
          }
        }
      }
      return true
    })
    this.speckleRenderer.clearFilter()
    this.speckleRenderer.beginFilter()
    const ghostRvs = []
    for (let k = 0; k < nodesGhost.length; k++) {
      ghostRvs.push(
        ...WorldTree.getRenderTree().getRenderViewsForNode(nodesGhost[k], nodesGhost[k])
      )
    }
    this.speckleRenderer.applyFilter(ghostRvs, {
      filterType: FilterMaterialType.GHOST
    })

    for (let k = 0; k < nodesGradient.length; k++) {
      const rvs = WorldTree.getRenderTree().getRenderViewsForNode(
        nodesGradient[k],
        nodesGradient[k]
      )
      // .map((value) => value.renderData.id)
      const t = (values[k] - data.min) / (data.max - data.min)
      this.speckleRenderer.applyFilter(rvs, {
        filterType: FilterMaterialType.GRADIENT,
        rampIndex: t
      })
    }

    this.speckleRenderer.endFilter()
    console.warn(`Filter time: ${performance.now() - start}`)
  }

  public debugGetFilterByNonNumericPropetyData(propertyName: string): {
    color?: { name: string; color: string; colorIndex: number; nodes: [] }
  } {
    // OG implementation
    const getColorHash = (objValue) => {
      const objValueAsString = '' + objValue
      let hash = 0
      for (let i = 0; i < objValueAsString.length; i++) {
        const chr = objValueAsString.charCodeAt(i)
        hash = (hash << 5) - hash + chr
        hash |= 0 // Convert to 32bit integer
      }
      hash = Math.abs(hash)
      const colorHue = hash % 360
      const rgb = new Color(`hsl(${colorHue}, 50%, 30%)`)
      return rgb.getHex()
    }

    const data: {
      color?: { name: string; color: string; colorIndex: number; nodes: [] }
    } = {}

    let colorCount = 0

    /** This is the lazy approach */
    WorldTree.getInstance().walk((node: TreeNode) => {
      if (!node.model.atomic) return true
      const propertyValue = node.model.raw[propertyName]
      if (propertyValue !== null && propertyValue !== undefined) {
        const color = getColorHash(propertyValue.split('.').reverse()[0])
        if (data[color] === undefined) {
          data[color] = {
            name: propertyValue.split('.').reverse()[0],
            color: new Color(MathUtils.randInt(0, 0xffffff)).getHex(),
            colorIndex: colorCount,
            nodes: []
          }
          colorCount++
        }
        if (!data[color].nodes.includes(node)) data[color].nodes.push(node)
      }

      return true
    })

    return data
  }

  public debugApplyByNonNumericPropetyFilter(data: {
    color?: { name: string; color: string; colorIndex: number; nodes: [] }
  }) {
    const start = performance.now()
    const colors = Object.values(data)
    colors.sort((a, b) => a.colorIndex - b.colorIndex)

    const rampTexture = Assets.generateDiscreetRampTexture(
      colors.map((val) => val.color)
    )
    this.speckleRenderer.clearFilter()
    this.speckleRenderer.beginFilter()

    for (let k = 0; k < colors.length; k++) {
      const nodes = colors[k].nodes
      let rvs = []
      for (let i = 0; i < nodes.length; i++) {
        rvs = rvs.concat(
          WorldTree.getRenderTree().getRenderViewsForNode(nodes[i], nodes[i])
        )
      }
      this.speckleRenderer.applyFilter(rvs, {
        filterType: FilterMaterialType.COLORED,
        rampIndex: colors[k].colorIndex / colors.length,
        rampIndexColor: new Color(colors[k].color),
        rampTexture
      })
    }
    this.speckleRenderer.endFilter()
    console.warn(`Filter time: ${performance.now() - start}`)
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
