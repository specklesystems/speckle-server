import { IViewer } from '../../..'
import EventEmitter from '../../EventEmitter'

/**TO DO: Need to add the enabled accesor */
export abstract class Extension extends EventEmitter {
  public get inject() {
    return []
  }
  protected viewer: IViewer

  public constructor(viewer: IViewer) {
    super()
    this.viewer = viewer
  }

  public async init?()
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
