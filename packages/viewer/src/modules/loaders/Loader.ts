import EventEmitter from '../EventEmitter.js'

export enum LoaderEvent {
  LoadProgress = 'load-progress',
  LoadCancelled = 'load-cancelled',
  LoadWarning = 'load-warning'
}

export interface LoaderEventPayload {
  [LoaderEvent.LoadProgress]: { progress: number; id: string }
  [LoaderEvent.LoadCancelled]: string
  [LoaderEvent.LoadWarning]: { message: string }
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

  public on<T extends LoaderEvent>(
    eventType: T,
    listener: (arg: LoaderEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  public abstract load(): Promise<boolean>
  public abstract cancel(): void
  public dispose(): void {
    super.dispose()
  }
}
