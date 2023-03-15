import ObjectLoader from '@speckle/objectloader'
import { ViewerEvent } from '../IViewer'
import Converter from './converter/Converter'
import EventEmitter from './EventEmitter'
import Logger from 'js-logger'
/**
 * Helper wrapper around the ObjectLoader class, with some built in assumptions.
 */

export default class ViewerObjectLoader {
  private _objectUrl: string
  private objectId: string
  private token: string
  private loader: ObjectLoader
  private converter: Converter

  private cancel = false

  private emiter: EventEmitter

  public get objectUrl(): string {
    return this._objectUrl
  }

  constructor(parentEmitter: EventEmitter, objectUrl, authToken, enableCaching) {
    this.emiter = parentEmitter
    this._objectUrl = objectUrl
    this.token = null
    try {
      this.token = authToken || localStorage.getItem('AuthToken')
    } catch (error) {
      // Accessing localStorage may throw when executing on sandboxed document, ignore.
    }

    if (!this.token) {
      Logger.error(
        'Viewer: no auth token present. Requests to non-public stream objects will fail.'
      )
    }

    // example url: `https://staging.speckle.dev/streams/a75ab4f10f/objects/f33645dc9a702de8af0af16bd5f655b0`
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
    this.objectId = segments[4]

    this.loader = new ObjectLoader({
      serverUrl,
      token: this.token,
      streamId,
      objectId: this.objectId,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: { enableCaching, customLogger: (Logger as any).log }
    })

    this.converter = new Converter(this.loader)

    this.cancel = false
  }

  public async load() {
    const start = performance.now()
    let first = true
    let current = 0
    let total = 0
    let viewerLoads = 0
    let firstObjectPromise = null
    Logger.warn('Downloading object ', this.objectUrl)
    for await (const obj of this.loader.getObjectIterator()) {
      if (this.cancel) {
        this.emiter.emit(ViewerEvent.LoadProgress, {
          progress: 1,
          id: this.objectId,
          url: this.objectUrl
        }) // to hide progress bar, easier on the frontend
        this.emiter.emit('load-cancelled', this.objectUrl)
        return
      }
      await this.converter.asyncPause()
      if (first) {
        // console.log(obj)
        firstObjectPromise = this.converter.traverse(this.objectUrl, obj, async () => {
          await this.converter.asyncPause()
          // objectWrapper.meta.__importedUrl = this.objectUrl
          viewerLoads++
        })
        first = false
        total = obj.totalChildrenCount
      }
      current++
      this.emiter.emit(ViewerEvent.LoadProgress, {
        progress: current / (total + 1),
        id: this.objectId
      })
    }

    if (firstObjectPromise) {
      await firstObjectPromise
    }

    // await this.viewer.sceneManager.postLoadFunction()
    Logger.warn(
      `Finished downloading object ${this.objectId} in ${
        (performance.now() - start) / 1000
      } seconds`
    )
    this.emiter.emit(ViewerEvent.DownloadComplete, this.objectUrl)

    if (viewerLoads === 0) {
      Logger.warn(`Viewer: no 3d objects found in object ${this.objectId}`)
      this.emiter.emit('load-warning', {
        message: `No displayable objects found in object ${this.objectId}.`
      })
    }
  }

  cancelLoad() {
    this.cancel = true
  }

  dispose() {
    this.loader.dispose()
  }
}
