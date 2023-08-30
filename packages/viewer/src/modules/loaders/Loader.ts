import EventEmitter from '../EventEmitter'

export enum LoaderEvent {
  LoadComplete = 'load-complete',
  LoadProgress = 'load-progress',
  LoadCancelled = 'load-cancelled',
  LoadWarning = 'load-warning'
}

export abstract class Loader extends EventEmitter {
  protected _resource: string
  public abstract get resource(): string

  public abstract load(): Promise<boolean>
  public abstract cancel()
  public abstract dispose()
}
