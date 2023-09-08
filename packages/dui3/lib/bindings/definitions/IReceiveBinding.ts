import { IModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelId: string, versionId: string) => Promise<void>
  cancelReceive: (modelId: string) => Promise<void>
  invalidate: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents {
  receiverProgress: (args: ReceiverProgressArgs) => void
}

export interface IReceiverModelCard extends IModelCard {
  typeDiscriminator: 'ReceiverModelCard'
  referencedObject: string
  modelName: string
  projectName: string
  sourceApp: string
  receiving?: boolean
  expired?: boolean
  progress?: ReceiverProgressArgs
}

export type ReceiverProgressArgs = {
  id: string
  status?: string
  progress?: number
}
