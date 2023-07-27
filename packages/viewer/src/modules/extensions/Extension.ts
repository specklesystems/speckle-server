import { IViewer } from '../..'
import EventEmitter from '../EventEmitter'

export abstract class Extension extends EventEmitter {
  protected viewer: IViewer

  public constructor(viewer: IViewer) {
    super()
    this.viewer = viewer
  }

  public abstract init()
  public abstract onUpdate(deltaTime: number)
  public abstract onRender()
  public abstract onResize()
}
