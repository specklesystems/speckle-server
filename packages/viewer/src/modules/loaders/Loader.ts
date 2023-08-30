import EventEmitter from '../EventEmitter'

export enum LoaderEvent {
  LoadComplete = 'load-complete',
  LoadProgress = 'load-progress',
  LoadCancelled = 'load-cancelled',
  LoadWarning = 'load-warning'
}

export abstract class Loader extends EventEmitter {
  public abstract get resource()

  public abstract load(): Promise<boolean>
  public abstract cancel()
  public abstract dispose()
}
