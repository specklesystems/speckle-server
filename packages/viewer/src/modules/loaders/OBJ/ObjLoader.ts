import { Group } from 'three'
import { Loader, LoaderEvent } from '../Loader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { ObjConverter } from './ObjConverter'
import { ObjGeometryConverter } from './ObjGeometryConverter'
import Logger from 'js-logger'
import { WorldTree } from '../../..'

export class ObjLoader extends Loader {
  private baseLoader: OBJLoader
  private converter: ObjConverter
  private tree: WorldTree
  private isFinished: boolean

  public get resource(): string {
    return this._resource
  }

  public get finished(): boolean {
    return this.isFinished
  }

  public constructor(targetTree: WorldTree, resource: string, resourceData?: string) {
    super(resource, resourceData)
    this.tree = targetTree
    this.baseLoader = new OBJLoader()
    this.converter = new ObjConverter(this.tree)
  }

  public load(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const pload = new Promise<void>((loadResolve, loadReject) => {
        if (!this._resourceData) {
          this.baseLoader.load(
            this._resource,
            async (group: Group) => {
              await this.converter.traverse(this._resource, group, async () => {})

              loadResolve()
            },
            (event: ProgressEvent) => {
              this.emit(LoaderEvent.LoadProgress, {
                progress: event.loaded / (event.total + 1),
                id: this._resource
              })
            },
            (event: ErrorEvent) => {
              Logger.error(`Loading obj ${this._resource} failed with ${event.error}`)
              loadReject()
            }
          )
        } else {
          this.converter
            .traverse(
              this._resource,
              this.baseLoader.parse(this._resourceData as string),
              async () => {}
            )
            .then(() => loadResolve())
            .catch((err) => {
              Logger.error(`Loading obj ${this._resource} failed with ${err}`)
              loadReject()
            })
        }
      })

      pload.then(async () => {
        const t0 = performance.now()
        const res = await this.tree
          .getRenderTree(this._resource)
          .buildRenderTree(new ObjGeometryConverter())
        Logger.log('Tree build time -> ', performance.now() - t0)
        this.isFinished = true
        resolve(res)
      })
      pload.catch(() => {
        Logger.error(`Could not load ${this._resource}`)
        reject()
      })
    })
  }

  public cancel() {
    this.isFinished = false
    throw new Error('Method not implemented.')
  }
  public dispose() {
    this.baseLoader = null
  }
}
