import { PropertyInfo } from '@speckle/objectloader2'
import EventEmitter from '../EventEmitter.js'

export enum LoaderEvent {
  LoadProgress = 'load-progress',
  LoadCancelled = 'load-cancelled',
  LoadWarning = 'load-warning',
  Converted = 'converted',
  Traversed = 'traversed'
}

export interface LoaderEventPayload {
  [LoaderEvent.LoadProgress]: { progress: number; id: string }
  [LoaderEvent.Converted]: { count: number }
  [LoaderEvent.Traversed]: { count: number }
  [LoaderEvent.LoadCancelled]: string
  [LoaderEvent.LoadWarning]: { message: string }
}

export abstract class Loader extends EventEmitter {
  protected _resource: string
  protected _resourceData: unknown

  public abstract get properties(): PropertyInfo[]
  public abstract get resource(): string
  public abstract get finished(): boolean

  protected constructor(resource: string, resourceData?: unknown) {
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
