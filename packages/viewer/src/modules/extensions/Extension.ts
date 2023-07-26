import { IViewer } from '../..'

export abstract class Extension {
  protected viewer: IViewer

  public constructor(viewer: IViewer) {
    this.viewer = viewer
  }

  public abstract init()
  public abstract onUpdate()
  public abstract onRender()
}
