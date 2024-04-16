import EventEmitter from '../EventEmitter'

export enum LoaderEvent {
  LoadProgress = 'load-progress',
  LoadCancelled = 'load-cancelled',
  LoadWarning = 'load-warning'
}

export abstract class Loader extends EventEmitter {
  protected _resource: string
  protected _resourceData: string | ArrayBuffer | undefined

  public abstract get resource(): string
  public abstract get finished(): boolean

  protected constructor(
    resource: string,
    resourceData?: string | ArrayBuffer | undefined
  ) {
    super()
    this._resource = resource
    this._resourceData = resourceData
  }

  public abstract load(): Promise<boolean>
  public abstract cancel(): void
  public abstract dispose(): void
}
