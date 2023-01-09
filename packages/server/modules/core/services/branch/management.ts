import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'
import {
  BranchCreateInput,
  CreateModelInput
} from '@/modules/core/graph/generated/graphql'
import { createBranch } from '@/modules/core/repositories/branches'
import { has } from 'lodash'

const isBranchCreateInput = (
  i: BranchCreateInput | CreateModelInput
): i is BranchCreateInput => has(i, 'streamId')

// TODO: Check for duplicates (in project as well)
export async function createBranchAndNotify(
  input: BranchCreateInput | CreateModelInput,
  creatorId: string
) {
  const branch = await createBranch({
    name: input.name,
    description: isBranchCreateInput(input) ? input.description || null : null,
    streamId: isBranchCreateInput(input) ? input.streamId : input.projectId,
    authorId: creatorId
  })
  await addBranchCreatedActivity({ branch })

  return branch
}
