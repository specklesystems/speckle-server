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
import { DefaultViewerParams, IViewer, ViewerParams } from '../IViewer'
import { World } from './World'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'
import { FilterMaterialType } from './FilteringManager'

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
    // this.interactions.zoomExtents()
    this.needsRender = true

    this.inProgressOperations = 0

    this.on('load-complete', (url) => {
      WorldTree.getInstance().walk((node: TreeNode) => {
        node.model.raw.__importedUrl = url
        return true
      })

      WorldTree.getRenderTree().buildRenderTree()
      this.speckleRenderer.addRenderTree()
      this.zoomExtents()

      console.warn('Built stuff')
    })
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

  onWindowResize() {
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
    this.stats.update()
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

  public async loadObject(
    url: string,
    token: string | undefined,
    enableCaching = true
  ) {
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
    url
    // try {
    //   if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)
    //   await this.loaders[url].unload()
    //   delete this.loaders[url]
    // } finally {
    //   if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    // }
  }

  public async unloadAll() {
    for (const key of Object.keys(this.loaders)) {
      delete this.loaders[key]
    }

    await this.applyFilter(null)
    this.speckleRenderer.removeRenderTree()
    WorldTree.getRenderTree().purge()
    WorldTree.getInstance().purge()

    return
  }

  public async applyFilter(filter: unknown) {
    filter
    // try {
    //   if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)
    //   this.interactions.deselectObjects()
    //   return await this.sceneManager.sceneObjects.applyFilter(filter)
    // } finally {
    //   if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    // }
  }

  public getObjectsProperties() {
    // return this.spceneManager.sceneObjects.getObjectsProperties(includeAll)
    // const props = []
    const flattenObject = function (obj) {
      const flatten = {}
      for (const k in obj) {
        if (['id', '__closure', '__parents', 'bbox', 'totalChildrenCount'].includes(k))
          continue
        const v = obj[k]
        if (v === null || v === undefined || Array.isArray(v)) continue
        if (v.constructor === Object) {
          const flattenProp = flattenObject(v)
          for (const pk in flattenProp) {
            flatten[`${k}.${pk}`] = flattenProp[pk]
          }
          continue
        }
        if (['string', 'number', 'boolean'].includes(typeof v)) flatten[k] = v
      }
      return flatten
    }
    const propValues = {}

    WorldTree.getInstance().walk((node: TreeNode) => {
      const obj = flattenObject(node.model.raw)
      for (const prop of Object.keys(obj)) {
        if (!(prop in propValues)) {
          propValues[prop] = []
        }
        propValues[prop].push(obj[prop])
      }
      return true
    })

    const propInfo = {}
    for (const prop in propValues) {
      const pinfo = {
        type: typeof propValues[prop][0],
        objectCount: propValues[prop].length,
        allValues: propValues[prop],
        uniqueValues: {},
        minValue: propValues[prop][0],
        maxValue: propValues[prop][0]
      }
      for (const v of propValues[prop]) {
        if (v < pinfo.minValue) pinfo.minValue = v
        if (v > pinfo.maxValue) pinfo.maxValue = v
        if (!(v in pinfo.uniqueValues)) {
          pinfo.uniqueValues[v] = 0
        }
        pinfo.uniqueValues[v] += 1
      }

      propInfo[prop] = pinfo
    }
  }

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
      const propertyValue = node.model.raw[propertyName]
      if (propertyValue !== null) {
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

  // private isObject(value) {
  //   return !!(value && typeof value === 'object' && !Array.isArray(value))
  // }

  // private findObjectProperty(object = {}, keyToMatch = '') {
  //   if (this.isObject(object)) {
  //     const entries = Object.entries(object)

  //     for (let i = 0; i < entries.length; i += 1) {
  //       const [objectKey, objectValue] = entries[i]

  //       if (objectKey === keyToMatch) {
  //         return object[objectKey]
  //       }

  //       if (this.isObject(objectValue)) {
  //         const child = this.findObjectProperty(objectValue, keyToMatch)

  //         if (child !== null) {
  //           return child
  //         }
  //       }
  //     }
  //   }

  //   return null
  // }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
