import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { BranchRecord } from '@/modules/core/helpers/types'
import { pubsub, BranchPubsubEvents } from '@/modules/shared'

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
    })
  ])
}
