import { BranchRecord } from '@/modules/core/helpers/types'

export type Model = BranchRecord
export type Branch = Model

export type ModelTreeItem = {
  name: string
  updatedAt: Date // TODO: set to newest updated at from its children / model
  model?: BranchRecord
  children: ModelTreeItem[]
}
