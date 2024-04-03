import { IViewer } from '../..'
import EventEmitter from '../EventEmitter'

export abstract class Extension extends EventEmitter {
  public get inject(): Array<new (viewer: IViewer, ...args) => Extension> {
    return []
  }

  protected viewer: IViewer
  protected _enabled: boolean

  public abstract get enabled(): boolean

  public abstract set enabled(value: boolean)

  public constructor(viewer: IViewer) {
    super()
    this.viewer = viewer
  }

  public onEarlyUpdate(deltaTime?: number) {
    deltaTime
    /* EMPTY*/
  }
  public onLateUpdate(deltaTime?: number) {
    deltaTime
    /* EMPTY*/
  }
  public onRender() {
    /* EMPTY*/
  }
  public onResize() {
    /* EMPTY*/
  }
}
