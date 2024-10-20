import { Group } from 'three'
import { Loader, LoaderEvent } from '../Loader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ObjConverter } from './ObjConverter.js'
import { ObjGeometryConverter } from './ObjGeometryConverter.js'
import { WorldTree } from '../../../index.js'
import Logger from '../../utils/Logger.js'

export class ObjLoader extends Loader {
  protected baseLoader: OBJLoader
  protected converter: ObjConverter
  protected tree: WorldTree
  protected isFinished: boolean = false

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
      new Promise<void>((loadResolve, loadReject) => {
        if (!this._resourceData) {
          this.baseLoader.load(
            this._resource,
            (group: Group) => {
              this.converter
                .traverse(this._resource, group, async () => {})
                .then(() => {
                  loadResolve()
                })
                .catch(() => {
                  loadReject()
                })
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
        .then(async () => {
          const t0 = performance.now()
          const renderTree = this.tree.getRenderTree(this._resource)
          if (renderTree) {
            const res = await renderTree.buildRenderTree(new ObjGeometryConverter())
            Logger.log('Tree build time -> ', performance.now() - t0)
            this.isFinished = true
            resolve(res)
          } else {
            Logger.error(`Could not get render tree for ${this._resource}`)
            reject()
          }
        })
        .catch(() => {
          Logger.error(`Could not load ${this._resource}`)
          reject()
        })
    })
  }

  public cancel() {
    this.isFinished = false
  }

  public dispose() {
    super.dispose()
  }
}
