import Logger from 'js-logger'
import SpeckleConverter from './SpeckleConverter'
import { Loader, LoaderEvent } from '../Loader'
import ObjectLoader from '@speckle/objectloader'
import { SpeckleGeometryConverter } from './SpeckleGeometryConverter'
import { WorldTree } from '../../..'
import { AsyncPause } from '../../World'

export class SpeckleLoader extends Loader {
  private loader: ObjectLoader
  private converter: SpeckleConverter
  private tree: WorldTree
  private priority: number = 1
  private isCancelled = false
  private isFinished = false

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
    resourceData?: string | ArrayBuffer,
    priority: number = 1
  ) {
    super(resource, resourceData)
    this.tree = targetTree
    this.priority = priority
    let token = null
    try {
      token = authToken || localStorage.getItem('AuthToken')
    } catch (error) {
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

    this.loader = new ObjectLoader({
      serverUrl,
      token,
      streamId,
      objectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: { enableCaching, customLogger: (Logger as any).log }
    })

    this.converter = new SpeckleConverter(this.loader, this.tree)
  }

  public async load(): Promise<boolean> {
    const start = performance.now()
    let first = true
    let current = 0
    let total = 0
    let viewerLoads = 0
    let firstObjectPromise = null

    Logger.warn('Downloading object ', this._resource)

    const pause = new AsyncPause()
    for await (const obj of this.loader.getObjectIterator()) {
      if (this.isCancelled) {
        this.emit(LoaderEvent.LoadCancelled, this._resource)
        return Promise.resolve(false)
      }
      if (first) {
        firstObjectPromise = this.converter.traverse(this._resource, obj, async () => {
          viewerLoads++
          pause.tick(100)
          if (pause.needsWait) {
            await pause.wait(16)
          }
        })
        first = false
        total = obj.totalChildrenCount
      }
      current++
      this.emit(LoaderEvent.LoadProgress, {
        progress: current / (total + 1),
        id: this._resource
      })
    }

    if (firstObjectPromise) {
      await firstObjectPromise
    }

    Logger.warn(
      `Finished converting object ${this._resource} in ${
        (performance.now() - start) / 1000
      } seconds. Node count: ${this.tree.nodeCount}`
    )

    if (viewerLoads === 0) {
      Logger.warn(`Viewer: no 3d objects found in object ${this._resource}`)
      this.emit(LoaderEvent.LoadWarning, {
        message: `No displayable objects found in object ${this._resource}.`
      })
    }
    if (this.isCancelled) {
      return Promise.resolve(false)
    }

    const t0 = performance.now()
    const geometryConverter = new SpeckleGeometryConverter()

    const renderTree = this.tree.getRenderTree(this._resource)
    if (!renderTree) return Promise.resolve(false)
    const p = renderTree.buildRenderTree(geometryConverter)

    p.then(() => {
      Logger.log('ASYNC Tree build time -> ', performance.now() - t0)
      this.isFinished = true
    })
    return p
  }

  cancel() {
    this.isCancelled = true
    this.isFinished = false
  }

  dispose() {
    this.loader.dispose()
  }
}
