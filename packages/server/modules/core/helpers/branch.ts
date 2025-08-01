import type {
  BranchDeleteInput,
  BranchUpdateInput,
  DeleteModelInput,
  UpdateModelInput
} from '@/modules/core/graph/generated/graphql'
import { has } from 'lodash-es'

export const isBranchUpdateInput = (
  i: BranchUpdateInput | UpdateModelInput
): i is BranchUpdateInput => has(i, 'streamId')

export const isBranchDeleteInput = (
  i: BranchDeleteInput | DeleteModelInput
): i is BranchDeleteInput => has(i, 'streamId')
