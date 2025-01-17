import { Roles, ensureError, isNullOrUndefined } from '@speckle/shared'
import {
  BranchDeleteError,
  BranchNameError,
  BranchNotFoundError,
  BranchUpdateError
} from '@/modules/core/errors/branch'
import {
  BranchCreateInput,
  BranchDeleteInput,
  BranchUpdateInput,
  CreateModelInput,
  DeleteModelInput,
  UpdateModelInput
} from '@/modules/core/graph/generated/graphql'
import { BranchRecord } from '@/modules/core/helpers/types'
import { has } from 'lodash'
import { isBranchDeleteInput, isBranchUpdateInput } from '@/modules/core/helpers/branch'
import {
  CreateBranchAndNotify,
  DeleteBranchAndNotify,
  DeleteBranchById,
  GetBranchById,
  GetStreamBranchByName,
  StoreBranch,
  UpdateBranch,
  UpdateBranchAndNotify
} from '@/modules/core/domain/branches/operations'
import {
  GetStream,
  MarkBranchStreamUpdated
} from '@/modules/core/domain/streams/operations'
import {
  AddBranchCreatedActivity,
  AddBranchDeletedActivity,
  AddBranchUpdatedActivity
} from '@/modules/activitystream/domain/operations'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { ModelEvents } from '@/modules/core/domain/branches/events'

const isBranchCreateInput = (
  i: BranchCreateInput | CreateModelInput
): i is BranchCreateInput => has(i, 'streamId')

export const createBranchAndNotifyFactory =
  (deps: {
    getStreamBranchByName: GetStreamBranchByName
    createBranch: StoreBranch
    addBranchCreatedActivity: AddBranchCreatedActivity
  }): CreateBranchAndNotify =>
  async (input: BranchCreateInput | CreateModelInput, creatorId: string) => {
    const streamId = isBranchCreateInput(input) ? input.streamId : input.projectId
    const existingBranch = await deps.getStreamBranchByName(streamId, input.name)
    if (existingBranch) {
      throw new BranchNameError('A branch with this name already exists')
    }

    const branch = await deps.createBranch({
      name: input.name,
      description: input.description ?? null,
      streamId: isBranchCreateInput(input) ? input.streamId : input.projectId,
      authorId: creatorId
    })
    await deps.addBranchCreatedActivity({ branch })

    return branch
  }

export const updateBranchAndNotifyFactory =
  (deps: {
    getBranchById: GetBranchById
    updateBranch: UpdateBranch
    addBranchUpdatedActivity: AddBranchUpdatedActivity
  }): UpdateBranchAndNotify =>
  async (input: BranchUpdateInput | UpdateModelInput, userId: string) => {
    const streamId = isBranchUpdateInput(input) ? input.streamId : input.projectId
    const existingBranch = await deps.getBranchById(input.id)
    if (!existingBranch) {
      throw new BranchNotFoundError('Branch not found', { info: { ...input, userId } })
    }
    if (existingBranch.streamId !== streamId) {
      throw new BranchUpdateError(
        'The branch ID and stream ID do not match, please check your inputs',
        {
          info: { ...input, userId }
        }
      )
    }

    const updates: Partial<BranchRecord> = {
      ...(!isNullOrUndefined(input.description)
        ? { description: input.description }
        : {}),
      ...(input.name?.length ? { name: input.name } : {})
    }
    if (!Object.values(updates).length) {
      throw new BranchUpdateError('Please specify a property to update')
    }

    let newBranch: BranchRecord
    try {
      newBranch = await deps.updateBranch(input.id, updates)
    } catch (e) {
      if (ensureError(e).message.includes('branches_streamid_name_unique')) {
        throw new BranchUpdateError(
          'A branch with this name already exists in the parent stream',
          {
            info: { ...input, userId }
          }
        )
      } else {
        throw e
      }
    }

    if (newBranch) {
      await deps.addBranchUpdatedActivity({
        update: input,
        userId,
        oldBranch: existingBranch,
        newBranch
      })
    }

    return newBranch
  }

export const deleteBranchAndNotifyFactory =
  (deps: {
    getStream: GetStream
    getBranchById: GetBranchById
    emitEvent: EventBusEmit
    markBranchStreamUpdated: MarkBranchStreamUpdated
    addBranchDeletedActivity: AddBranchDeletedActivity
    deleteBranchById: DeleteBranchById
  }): DeleteBranchAndNotify =>
  async (input: BranchDeleteInput | DeleteModelInput, userId: string) => {
    const streamId = isBranchDeleteInput(input) ? input.streamId : input.projectId
    const [existingBranch, stream] = await Promise.all([
      deps.getBranchById(input.id),
      deps.getStream({ streamId, userId })
    ])
    if (!existingBranch) {
      throw new BranchNotFoundError('Branch not found', { info: { ...input, userId } })
    }
    if (!stream || existingBranch.streamId !== streamId) {
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

    const isDeleted = !!(await deps.deleteBranchById(existingBranch.id))
    if (isDeleted) {
      await Promise.all([
        deps.addBranchDeletedActivity({
          input,
          userId,
          branchName: existingBranch.name
        }),
        deps.markBranchStreamUpdated(input.id),
        deps.emitEvent({
          eventName: ModelEvents.Deleted,
          payload: {
            modelId: existingBranch.id,
            model: existingBranch,
            projectId: streamId
          }
        })
      ])
    }

    return isDeleted
  }
