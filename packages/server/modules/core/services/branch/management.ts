import { addBranchCreatedActivity } from '@/modules/activitystream/services/branchActivity'
import { BranchCreateError } from '@/modules/core/errors/branch'
import {
  BranchCreateInput,
  CreateModelInput
} from '@/modules/core/graph/generated/graphql'
import {
  createBranch,
  getStreamBranchByName
} from '@/modules/core/repositories/branches'
import { has } from 'lodash'

const isBranchCreateInput = (
  i: BranchCreateInput | CreateModelInput
): i is BranchCreateInput => has(i, 'streamId')

export async function createBranchAndNotify(
  input: BranchCreateInput | CreateModelInput,
  creatorId: string
) {
  const streamId = isBranchCreateInput(input) ? input.streamId : input.projectId
  const existingBranch = await getStreamBranchByName(streamId, input.name)
  if (existingBranch) {
    throw new BranchCreateError('A branch with this name already exists')
  }

  const branch = await createBranch({
    name: input.name,
    description: isBranchCreateInput(input) ? input.description || null : null,
    streamId: isBranchCreateInput(input) ? input.streamId : input.projectId,
    authorId: creatorId
  })
  await addBranchCreatedActivity({ branch })

  return branch
}
