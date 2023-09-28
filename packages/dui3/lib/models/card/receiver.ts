import { IModelCard } from '~~/lib/models/card'

export interface IReceiverModelCard extends IModelCard {
  typeDiscriminator: 'ReceiverModelCard'
  referencedObject: string
  modelName: string
  projectName: string
  sourceApp: string
  receiving?: boolean
}
