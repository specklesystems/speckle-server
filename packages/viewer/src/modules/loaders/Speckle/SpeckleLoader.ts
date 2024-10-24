import SpeckleConverter from './SpeckleConverter.js'
import { Loader, LoaderEvent } from '../Loader.js'
import ObjectLoader from '@speckle/objectloader'
import { SpeckleGeometryConverter } from './SpeckleGeometryConverter.js'
import { WorldTree, type SpeckleObject } from '../../../index.js'
import { AsyncPause } from '../../World.js'
import Logger from '../../utils/Logger.js'

export class SpeckleLoader extends Loader {
  protected loader: ObjectLoader
  protected converter: SpeckleConverter
  protected tree: WorldTree
  protected isCancelled = false
  protected isFinished = false

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
    resourceData?: string | ArrayBuffer
  ) {
    super(resource, resourceData)
    this.tree = targetTree
    let token = undefined
    try {
      token = authToken || (localStorage.getItem('AuthToken') as string | undefined)
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
    const total = await this.loader.getTotalObjectCount()
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
        firstObjectPromise = this.converter.traverse(
          this._resource,
          obj as SpeckleObject,
          async () => {
            viewerLoads++
            pause.tick(100)
            if (pause.needsWait) {
              await pause.wait(16)
            }
          }
        )
        first = false
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

    await this.converter.convertInstances()
    await this.converter.applyMaterials()

    const t0 = performance.now()
    const geometryConverter = new SpeckleGeometryConverter()

    const renderTree = this.tree.getRenderTree(this._resource)
    if (!renderTree) return Promise.resolve(false)
    const p = renderTree.buildRenderTree(geometryConverter)

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

  cancel() {
    this.isCancelled = true
    this.isFinished = false
  }

  dispose() {
    super.dispose()
    this.loader.dispose()
  }
}
