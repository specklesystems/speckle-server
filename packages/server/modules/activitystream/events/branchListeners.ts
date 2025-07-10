import {
  AddBranchCreatedActivity,
  AddBranchDeletedActivity,
  AddBranchUpdatedActivity,
  SaveStreamActivity
} from '@/modules/activitystream/domain/operations'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { ModelEvents } from '@/modules/core/domain/branches/events'
import { isBranchDeleteInput, isBranchUpdateInput } from '@/modules/core/helpers/branch'
import { EventBusListen } from '@/modules/shared/services/eventBus'

/**
 * Save "branch created" activity
 */
const addBranchCreatedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddBranchCreatedActivity =>
  async (params) => {
    const { branch } = params

    await saveStreamActivity({
      streamId: branch.streamId,
      resourceType: StreamResourceTypes.Branch,
      resourceId: branch.id,
      actionType: StreamActionTypes.Branch.Create,
      userId: branch.authorId,
      info: { branch },
      message: `Branch created: ${branch.name} (${branch.id})`
    })
  }

const addBranchUpdatedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddBranchUpdatedActivity =>
  async (params) => {
    const { update, userId, oldBranch } = params

    const streamId = isBranchUpdateInput(update) ? update.streamId : update.projectId
    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Branch,
      resourceId: update.id,
      actionType: StreamActionTypes.Branch.Update,
      userId,
      info: { old: oldBranch, new: update },
      message: `Branch metadata changed for branch ${update.id}`
    })
  }

const addBranchDeletedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddBranchDeletedActivity =>
  async (params) => {
    const { input, userId, branchName } = params

    const streamId = isBranchDeleteInput(input) ? input.streamId : input.projectId
    await Promise.all([
      saveStreamActivity({
        streamId,
        resourceType: StreamResourceTypes.Branch,
        resourceId: input.id,
        actionType: StreamActionTypes.Branch.Delete,
        userId,
        info: { branch: { ...input, name: branchName } },
        message: `Branch deleted: '${branchName}' (${input.id})`
      })
    ])
  }

export const reportBranchActivityFactory =
  (deps: { eventListen: EventBusListen; saveStreamActivity: SaveStreamActivity }) =>
  () => {
    const addBranchCreatedActivity = addBranchCreatedActivityFactory(deps)
    const addBranchUpdatedActivity = addBranchUpdatedActivityFactory(deps)
    const addBranchDeletedActivity = addBranchDeletedActivityFactory(deps)

    const quitters = [
      deps.eventListen(ModelEvents.Created, async (payload) => {
        await addBranchCreatedActivity({ branch: payload.payload.model })
      }),
      deps.eventListen(ModelEvents.Updated, async ({ payload }) => {
        await addBranchUpdatedActivity({
          update: payload.update,
          userId: payload.userId,
          oldBranch: payload.oldModel,
          newBranch: payload.newModel
        })
      }),
      deps.eventListen(ModelEvents.Deleted, async ({ payload }) => {
        await addBranchDeletedActivity({
          userId: payload.userId,
          input: payload.input,
          branchName: payload.model.name
        })
      })
    ]

    return () => {
      quitters.forEach((quit) => quit())
    }
  }
