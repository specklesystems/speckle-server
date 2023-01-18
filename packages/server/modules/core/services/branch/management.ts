import { Roles } from '@speckle/shared'
import {
  addBranchCreatedActivity,
  addBranchDeletedActivity,
  addBranchUpdatedActivity
} from '@/modules/activitystream/services/branchActivity'
import {
  BranchCreateError,
  BranchDeleteError,
  BranchUpdateError
} from '@/modules/core/errors/branch'
import {
  BranchCreateInput,
  BranchDeleteInput,
  BranchUpdateInput,
  CreateModelInput
} from '@/modules/core/graph/generated/graphql'
import { BranchRecord } from '@/modules/core/helpers/types'
import {
  createBranch,
  deleteBranchById,
  getBranchById,
  getStreamBranchByName,
  updateBranch
} from '@/modules/core/repositories/branches'
import { getStream, markBranchStreamUpdated } from '@/modules/core/repositories/streams'
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

export async function updateBranchAndNotify(input: BranchUpdateInput, userId: string) {
  const existingBranch = await getBranchById(input.id)
  if (!existingBranch) {
    throw new BranchUpdateError('Branch not found', { info: { ...input, userId } })
  }
  if (existingBranch.streamId !== input.streamId) {
    throw new BranchUpdateError(
      'The branch ID and stream ID do not match, please check your inputs',
      {
        info: { ...input, userId }
      }
    )
  }

  const updates: Partial<BranchRecord> = {
    ...(input.description ? { description: input.description } : {}),
    ...(input.name ? { name: input.name } : {})
  }
  if (!Object.values(updates).length) {
    throw new BranchUpdateError('Please specify a property to update')
  }

  const newBranch = await updateBranch(input.id, updates)

  if (newBranch) {
    await addBranchUpdatedActivity({
      update: input,
      userId,
      oldBranch: existingBranch
    })
  }

  return newBranch
}

export async function deleteBranchAndNotify(input: BranchDeleteInput, userId: string) {
  const [existingBranch, stream] = await Promise.all([
    getBranchById(input.id),
    getStream({ streamId: input.streamId, userId })
  ])
  if (!existingBranch) {
    throw new BranchUpdateError('Branch not found', { info: { ...input, userId } })
  }
  if (!stream || existingBranch.streamId !== input.streamId) {
    throw new BranchUpdateError(
      'The branch ID and stream ID do not match, please check your inputs',
      {
        info: { ...input, userId }
      }
    )
  }
  if (existingBranch.authorId !== userId && stream.role !== Roles.Stream.Owner) {
    throw new BranchUpdateError(
      'Only the branch creator or stream owners are allowed to delete branches',
      {
        info: { ...input, userId }
      }
    )
  }
  if (existingBranch.name === 'main') {
    throw new BranchDeleteError('Cannot delete the main branch', {
      info: { ...input, userId }
    })
  }

  const isDeleted = !!(await deleteBranchById(existingBranch.id))
  if (isDeleted) {
    await addBranchDeletedActivity({
      input,
      userId,
      branchName: existingBranch.name
    })
    await markBranchStreamUpdated(input.id)
  }

  return isDeleted
}
