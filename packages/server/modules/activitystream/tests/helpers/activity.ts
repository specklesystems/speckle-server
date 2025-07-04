import { Activity as ActivityModel } from '@/modules/core/dbSchema'
import { AnyActivity } from '@/modules/activitystream/domain/types'
import { Knex } from 'knex'

type GetActivityHelperArgs = Partial<{
  workspaceId: string
  projectId: string
  eventType: string
  userId: string
}>

export const getActivityHelperFactory =
  ({ db }: { db: Knex }) =>
  async (filters: GetActivityHelperArgs = {}): Promise<AnyActivity[]> => {
    const { workspaceId, projectId, eventType, userId } = filters

    const q = db<AnyActivity>(ActivityModel.name).select('*')

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

    return (await q) as AnyActivity[]
  }
