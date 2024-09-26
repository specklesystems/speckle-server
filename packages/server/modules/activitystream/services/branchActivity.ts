import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { BranchRecord } from '@/modules/core/helpers/types'
import {
  pubsub,
  BranchSubscriptions as BranchPubsubEvents
} from '@/modules/shared/utils/subscriptions'
import {
  BranchDeleteInput,
  BranchUpdateInput,
  DeleteModelInput,
  ProjectModelsUpdatedMessageType,
  UpdateModelInput
} from '@/modules/core/graph/generated/graphql'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { isBranchDeleteInput, isBranchUpdateInput } from '@/modules/core/helpers/branch'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'

/**
 * Save "branch created" activity
 */
export async function addBranchCreatedActivity(params: { branch: BranchRecord }) {
  const { branch } = params

  await Promise.all([
    saveActivityFactory({ db })({
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
  update: BranchUpdateInput | UpdateModelInput
  userId: string
  oldBranch: BranchRecord
  newBranch: BranchRecord
}) {
  const { update, userId, oldBranch, newBranch } = params

  const streamId = isBranchUpdateInput(update) ? update.streamId : update.projectId
  await Promise.all([
    saveActivityFactory({ db })({
      streamId,
      resourceType: ResourceTypes.Branch,
      resourceId: update.id,
      actionType: ActionTypes.Branch.Update,
      userId,
      info: { old: oldBranch, new: update },
      message: `Branch metadata changed for branch ${update.id}`
    }),
    pubsub.publish(BranchPubsubEvents.BranchUpdated, {
      branchUpdated: { ...update },
      streamId,
      branchId: update.id
    }),
    publish(ProjectSubscriptions.ProjectModelsUpdated, {
      projectId: streamId,
      projectModelsUpdated: {
        model: newBranch,
        id: newBranch.id,
        type: ProjectModelsUpdatedMessageType.Updated
      }
    })
  ])
}

export async function addBranchDeletedActivity(params: {
  input: BranchDeleteInput | DeleteModelInput
  userId: string
  branchName: string
}) {
  const { input, userId, branchName } = params

  const streamId = isBranchDeleteInput(input) ? input.streamId : input.projectId
  await Promise.all([
    saveActivityFactory({ db })({
      streamId,
      resourceType: ResourceTypes.Branch,
      resourceId: input.id,
      actionType: ActionTypes.Branch.Delete,
      userId,
      info: { branch: { ...input, name: branchName } },
      message: `Branch deleted: '${branchName}' (${input.id})`
    }),
    pubsub.publish(BranchPubsubEvents.BranchDeleted, {
      branchDeleted: input,
      streamId
    }),
    publish(ProjectSubscriptions.ProjectModelsUpdated, {
      projectId: streamId,
      projectModelsUpdated: {
        id: input.id,
        type: ProjectModelsUpdatedMessageType.Deleted,
        model: null
      }
    })
  ])
}
