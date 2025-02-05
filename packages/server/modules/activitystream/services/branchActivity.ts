import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  BranchSubscriptions as BranchPubsubEvents,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { ProjectModelsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'
import { isBranchDeleteInput, isBranchUpdateInput } from '@/modules/core/helpers/branch'
import {
  AddBranchCreatedActivity,
  AddBranchDeletedActivity,
  AddBranchUpdatedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'

/**
 * Save "branch created" activity
 */
export const addBranchCreatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddBranchCreatedActivity =>
  async (params) => {
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
      publish(BranchPubsubEvents.BranchCreated, {
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

export const addBranchUpdatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddBranchUpdatedActivity =>
  async (params) => {
    const { update, userId, oldBranch, newBranch } = params

    const streamId = isBranchUpdateInput(update) ? update.streamId : update.projectId
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Branch,
        resourceId: update.id,
        actionType: ActionTypes.Branch.Update,
        userId,
        info: { old: oldBranch, new: update },
        message: `Branch metadata changed for branch ${update.id}`
      }),
      publish(BranchPubsubEvents.BranchUpdated, {
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

export const addBranchDeletedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddBranchDeletedActivity =>
  async (params) => {
    const { input, userId, branchName } = params

    const streamId = isBranchDeleteInput(input) ? input.streamId : input.projectId
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Branch,
        resourceId: input.id,
        actionType: ActionTypes.Branch.Delete,
        userId,
        info: { branch: { ...input, name: branchName } },
        message: `Branch deleted: '${branchName}' (${input.id})`
      }),
      publish(BranchPubsubEvents.BranchDeleted, {
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
