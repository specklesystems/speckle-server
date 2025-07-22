import SpeckleConverter from './SpeckleConverter.js'
import { Loader, LoaderEvent } from '../Loader.js'
import { SpeckleGeometryConverter } from './SpeckleGeometryConverter.js'
import { WorldTree, type SpeckleObject } from '../../../index.js'
import Logger from '../../utils/Logger.js'
import {
  getFeatureFlag,
  ObjectLoader2Flags,
  ObjectLoader2,
  ObjectLoader2Factory
} from '@speckle/objectloader2'
import { TIME_MS } from '@speckle/shared'

export class SpeckleLoader extends Loader {
  protected loader: ObjectLoader2
  protected converter: SpeckleConverter
  protected tree: WorldTree
  protected isCancelled = false
  protected isFinished = false
  protected log: (message?: string, ...args: unknown[]) => void

  public get resource(): string {
    return this._resource
  }

  public get finished(): boolean {
    return this.isFinished
  }

  constructor(
    targetTree: WorldTree,
    resource: string,
    authToken?: string,
    enableCaching?: boolean,
    resourceData?: unknown,
    logger?: (message?: string, ...args: unknown[]) => void
  ) {
    super(resource, resourceData)
    this.tree = targetTree
    this.log = logger || Logger.log
    try {
      this.loader = this.initObjectLoader(
        resource,
        authToken,
        enableCaching,
        resourceData
      )
    } catch (e) {
      Logger.error(e)
      return
    }

    this.converter = new SpeckleConverter(this.loader, this.tree)
  }

  protected initObjectLoader(
    resource: string,
    authToken?: string,
    _enableCaching?: boolean,
    resourceData?: unknown
  ): ObjectLoader2 {
    resourceData
    let token = undefined
    try {
      token = authToken || (localStorage.getItem('AuthToken') as string | undefined)
    } catch {
      // Accessing localStorage may throw when executing on sandboxed document, ignore.
    }

    if (!token) {
      Logger.error(
        'Viewer: no auth token present. Requests to non-public stream objects will fail.'
      )
    }

    const url = new URL(resource)

    const segments = url.pathname.split('/')
    if (
      segments.length < 5 ||
      url.pathname.indexOf('streams') === -1 ||
      url.pathname.indexOf('objects') === -1
    ) {
      throw new Error('Unexpected object url format.')
    }

    const serverUrl = url.origin
    const streamId = segments[2]
    const objectId = segments[4]

    return ObjectLoader2Factory.createFromUrl({
      serverUrl,
      streamId,
      objectId,
      token
    })
  }

  public async load(): Promise<boolean> {
    const start = performance.now()
    let first = true
    let dataloading = 0
    const total = await this.loader.getTotalObjectCount()
    let traversals = 0
    let firstObjectPromise = null
    this.progressListen()

    Logger.warn('Downloading object ', this.resource)

    for await (const obj of this.loader.getObjectIterator()) {
      if (this.isCancelled) {
        this.emit(LoaderEvent.LoadCancelled, this.resource)
        return Promise.resolve(false)
      }
      if (first) {
        firstObjectPromise = this.converter.traverse(
          this.resource,
          obj as SpeckleObject,
          (count) => {
            traversals++
            this.emit(LoaderEvent.Traversed, {
              count
            })
          }
        )
        first = false
      }
      dataloading++
      this.emit(LoaderEvent.LoadProgress, {
        progress: dataloading / (total + 1),
        id: this.resource
      })
    }

    if (firstObjectPromise) {
      await firstObjectPromise
    }

    Logger.warn(
      `Finished converting object ${this.resource} in ${
        (performance.now() - start) / TIME_MS.second
      } seconds. Node count: ${this.tree.nodeCount}`
    )

    if (traversals === 0) {
      Logger.warn(`Viewer: no 3d objects found in object ${this.resource}`)
      this.emit(LoaderEvent.LoadWarning, {
        message: `No displayable objects found in object ${this.resource}.`
      })
    }
    if (this.isCancelled) {
      return Promise.resolve(false)
    }

    await this.converter.convertInstances()
    await this.converter.applyMaterials()
    await this.converter.handleDuplicates()
    await this.loader.disposeAsync()

    const t0 = performance.now()
    const geometryConverter = new SpeckleGeometryConverter()

    const renderTree = this.tree.getRenderTree(this.resource)
    if (!renderTree) return Promise.resolve(false)
    const p = renderTree.buildRenderTree(geometryConverter, (count: number) => {
      this.emit(LoaderEvent.Converted, {
        count
      })
    })

    Logger.warn(
      `Finished rendering object . Node count: ${this.tree.nodeCount} Total: ${total}`
    )

    void p.then(() => {
      Logger.log('ASYNC Tree build time -> ', performance.now() - t0)
      Logger.log('Node build time -> ', renderTree.buildNodeTime)
      Logger.log('Apply transform time -> ', renderTree.applyTransformTime)
      Logger.log('Geometry build time -> ', renderTree.convertTime)
      Logger.log('Get Node time -> ', renderTree.getNodeTime)
      Logger.log('Other time -> ', renderTree.otherTime)
      Logger.log('Triangulation time -> ', geometryConverter.meshTriangulationTime)
      Logger.log(
        'ACTUAL Triangulation time -> ',
        geometryConverter.actualTriangulateTime
      )
      Logger.log('Push time -> ', geometryConverter.pushTime)
      this.isFinished = true
    })

    return p
  }

  private progressListen(): void {
    if (getFeatureFlag(ObjectLoader2Flags.DEBUG) !== 'true') {
      return
    }

    let dataProgress = 0
    this.on(LoaderEvent.LoadProgress, (data) => {
      const p = Math.floor(data.progress * 100)
      if (p > dataProgress) {
        Logger.log(`[debug] Loading ${p}%`)
        dataProgress = p
      }
    })
    this.on(LoaderEvent.Traversed, (data) => {
      if (data.count % 500 === 0) {
        Logger.log(`[debug] Traversed ${data.count}`)
      }
    })
    this.on(LoaderEvent.Converted, (data) => {
      if (data.count % 500 === 0) {
        Logger.log(`[debug] Converted ${data.count}`)
      }
    })
  }

  cancel() {
    this.isCancelled = true
    this.isFinished = false
  }

  dispose() {
    super.dispose()
    void this.loader.disposeAsync()
  }
}
