import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { BranchRecord } from '@/modules/core/helpers/types'
import { pubsub, BranchPubsubEvents } from '@/modules/shared'
import {
  BranchDeleteInput,
  BranchUpdateInput,
  ProjectModelsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'

/**
 * Save "branch created" activity
 */
export async function addBranchCreatedActivity(params: { branch: BranchRecord }) {
  const { branch } = params

  await Promise.all([
    saveActivity({
      streamId: branch.streamId,
      resourceType: ResourceTypes.Branch,
      resourceId: branch.id,
      actionType: ActionTypes.Branch.Create,
      userId: branch.authorId,
      info: { branch },
      message: `Branch created: ${branch.name} (${branch.id})`
    }),
    pubsub.publish(BranchPubsubEvents.BranchCreated, {
      branchCreated: { ...branch },
      streamId: branch.streamId
    }),
    publish(ProjectSubscriptions.ProjectModelsUpdated, {
      projectId: branch.streamId,
      projectModelsUpdated: {
        id: branch.id,
        type: ProjectModelsUpdatedMessageType.Created,
        model: branch
      }
    })
  ])
}

export async function addBranchUpdatedActivity(params: {
  update: BranchUpdateInput
  userId: string
  oldBranch: BranchRecord
  newBranch: BranchRecord
}) {
  const { update, userId, oldBranch, newBranch } = params

  await Promise.all([
    saveActivity({
      streamId: update.streamId,
      resourceType: ResourceTypes.Branch,
      resourceId: update.id,
      actionType: ActionTypes.Branch.Update,
      userId,
      info: { old: oldBranch, new: update },
      message: `Branch metadata changed for branch ${update.id}`
    }),
    pubsub.publish(BranchPubsubEvents.BranchUpdated, {
      branchUpdated: { ...update },
      streamId: update.streamId,
      branchId: update.id
    }),
    publish(ProjectSubscriptions.ProjectModelsUpdated, {
      projectId: update.streamId,
      projectModelsUpdated: {
        model: newBranch,
        id: newBranch.id,
        type: ProjectModelsUpdatedMessageType.Updated
      }
    })
  ])
}

export async function addBranchDeletedActivity(params: {
  input: BranchDeleteInput
  userId: string
  branchName: string
}) {
  const { input, userId, branchName } = params

  await Promise.all([
    saveActivity({
      streamId: input.streamId,
      resourceType: ResourceTypes.Branch,
      resourceId: input.id,
      actionType: ActionTypes.Branch.Delete,
      userId,
      info: { branch: { ...input, name: branchName } },
      message: `Branch deleted: '${branchName}' (${input.id})`
    }),
    pubsub.publish(BranchPubsubEvents.BranchDeleted, {
      branchDeleted: input,
      streamId: input.streamId
    }),
    publish(ProjectSubscriptions.ProjectModelsUpdated, {
      projectId: input.streamId,
      projectModelsUpdated: {
        id: input.id,
        type: ProjectModelsUpdatedMessageType.Deleted,
        model: null
      }
    })
  ])
}
