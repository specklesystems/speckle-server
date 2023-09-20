import { IModelCard, ToastInfo } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelId: string, versionId: string) => Promise<void>
  cancelReceive: (modelId: string) => Promise<void>
  invalidate: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents {
  receiverProgress: (args: ReceiverProgressArgs) => void
  notify: (args: ToastInfo) => void
}

export interface IReceiverModelCard extends IModelCard {
  typeDiscriminator: 'ReceiverModelCard'
  referencedObject: string
  modelName: string
  projectName: string
  sourceApp: string
  receiving?: boolean
}

export type ReceiverProgressArgs = {
  id: string
  status?: string
  progress?: number
}
