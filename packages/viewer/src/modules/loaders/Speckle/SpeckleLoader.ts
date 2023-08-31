import Logger from 'js-logger'
import Converter from './SpeckleConverter'
import { Viewer } from '../../Viewer'
import { Loader, LoaderEvent } from '../Loader'
import ObjectLoader from '@speckle/objectloader'
import { SpeckleGeometryConverter } from './SpeckleGeometryConverter'

export class SpeckleLoader extends Loader {
  private loader: ObjectLoader
  private converter: Converter
  private viewer: Viewer
  private isCancelled = false

  public get resource(): string {
    return this._resource
  }

  constructor(
    viewer: Viewer,
    objectUrl: string,
    authToken: string,
    enableCaching: boolean
  ) {
    super()
    this.viewer = viewer
    this._resource = objectUrl
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

    const url = new URL(objectUrl)

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

    this.converter = new Converter(this.loader, viewer.getWorldTree())
  }

  public async load(): Promise<boolean> {
    const start = performance.now()
    let first = true
    let current = 0
    let total = 0
    let viewerLoads = 0
    let firstObjectPromise = null
    Logger.warn('Downloading object ', this._resource)
    for await (const obj of this.loader.getObjectIterator()) {
      if (this.isCancelled) {
        this.emit(LoaderEvent.LoadCancelled, this._resource)
        return
      }
      await this.converter.asyncPause()
      if (first) {
        firstObjectPromise = this.converter.traverse(this._resource, obj, async () => {
          await this.converter.asyncPause()
          viewerLoads++
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
      } seconds. Node count: ${this.viewer.getWorldTree().nodeCount}`
    )

    if (viewerLoads === 0) {
      Logger.warn(`Viewer: no 3d objects found in object ${this._resource}`)
      this.emit(LoaderEvent.LoadWarning, {
        message: `No displayable objects found in object ${this._resource}.`
      })
    }
    const t0 = performance.now()
    const p = this.viewer
      .getWorldTree()
      .getRenderTree(this._resource)
      .buildRenderTree(new SpeckleGeometryConverter())

    p.then(() => {
      Logger.log('ASYNC Tree build time -> ', performance.now() - t0)
    })
    return p
  }

  cancel() {
    this.isCancelled = true
  }

  dispose() {
    this.loader.dispose()
  }
}
