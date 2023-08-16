import { IViewer } from '../../..'
import EventEmitter from '../../EventEmitter'

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
  public abstract onUpdate(deltaTime: number)
  public abstract onRender()
  public abstract onResize()
}
