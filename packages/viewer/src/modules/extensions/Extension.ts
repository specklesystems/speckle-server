import type { Constructor } from 'type-fest'
import { type IViewer } from '../../index.js'
import EventEmitter from '../EventEmitter.js'

export class Extension extends EventEmitter {
  public get inject(): Array<Constructor<Extension>> {
    return []
  }

  protected viewer: IViewer
  protected _enabled: boolean = false

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer, ...args: Extension[]) {
    args
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
