import { Activity as ActivityModel } from '@/modules/core/dbSchema'
import { AnyActivity } from '@/modules/activitystream/domain/types'

export async function getActivityHelper(
  filters: Partial<{
    workspaceId: string
    projectId: string
    eventType: string
    userId: string
  }> = {}
): Promise<AnyActivity[]> {
  const { workspaceId, projectId, eventType, userId } = filters

  const q = ActivityModel.knex<AnyActivity[]>()

  if (projectId) {
    q.where(ActivityModel.col.contextResourceId, projectId).andWhere(
      ActivityModel.col.contextResourceType,
      'project'
    )
  }

  if (workspaceId) {
    q.where(ActivityModel.col.contextResourceId, workspaceId).andWhere(
      ActivityModel.col.contextResourceType,
      'workspace'
    )
  }

  if (eventType) {
    q.andWhere(ActivityModel.col.eventType, eventType)
  }

  if (userId) {
    q.andWhere(ActivityModel.col.userId, userId)
  }

  return await q
}
