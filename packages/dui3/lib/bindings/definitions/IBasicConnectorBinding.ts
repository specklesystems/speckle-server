import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'
import type { IModelCard, IModelCardSharedEvents } from '~~/lib/models/card'

export const IBasicConnectorBindingKey = 'baseBinding'

// Needs to be agreed between Frontend and Core
export interface IBasicConnectorBinding
  extends IBinding<IBasicConnectorBindingHostEvents> {
  // Various
  /**
   * return `slug` from connectors, we should have name it better at the beginning
   */
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getConnectorVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  // Document state calls
  getDocumentState: () => Promise<DocumentModelStore>
  addModel: (model: IModelCard) => Promise<void>
  updateModel: (model: IModelCard) => Promise<void>
  highlightModel: (modelCardId: string) => Promise<void>
  highlightObjects: (objectIds: string[]) => Promise<void>
  removeModel: (model: IModelCard) => Promise<void>
}

export interface IBasicConnectorBindingHostEvents
  extends IBindingSharedEvents,
    IModelCardSharedEvents {
  documentChanged: () => void
}

export type DocumentModelStore = {
  models: IModelCard[]
}

export type DocumentInfo = {
  location: string
  name: string
  id: string
  message?: string
}

export type ToastInfo = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  action?: ToastAction
  timeout?: number
}

export type ToastAction = {
  url: string
  name: string
}
