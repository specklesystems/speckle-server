import { Group } from 'three'
import { Loader } from '../Loader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { ObjConverter } from './ObjConverter'
import { Viewer } from '../../Viewer'
import { ObjGeometryConverter } from './ObjGeometryConverter'
import Logger from 'js-logger'

export class ObjLoader extends Loader {
  private baseLoader: OBJLoader
  private converter: ObjConverter
  private viewer: Viewer

  public get resource(): string {
    return this._resource
  }

  public constructor(viewer: Viewer, resource: string) {
    super()
    this._resource = resource
    this.viewer = viewer
    this.baseLoader = new OBJLoader()
    this.converter = new ObjConverter(viewer.getWorldTree())
  }

  public load(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.baseLoader.load(this._resource, async (group: Group) => {
        await this.converter.traverse(this._resource, group, async (obj) => {
          obj
        })
        const t0 = performance.now()
        const res = await this.viewer
          .getWorldTree()
          .getRenderTree(this._resource)
          .buildRenderTree(new ObjGeometryConverter())
        Logger.log('ASYNC Tree build time -> ', performance.now() - t0)

        resolve(res)
      })
    })
  }

  public cancel() {
    throw new Error('Method not implemented.')
  }
  public dispose() {
    // TO DO
  }
}
