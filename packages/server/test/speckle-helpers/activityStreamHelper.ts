import { StreamActivityRecord } from '@/modules/activitystream/helpers/types'
import { StreamActivity } from '@/modules/core/dbSchema'

export async function getStreamActivities(
  streamId: string,
  extraFilters: Partial<{ actionType: string; userId: string }> = {}
): Promise<StreamActivityRecord[]> {
  const { actionType, userId } = extraFilters

  const q = StreamActivity.knex<StreamActivityRecord[]>().where(
    StreamActivity.col.streamId,
    streamId
  )

  if (actionType) {
    q.andWhere(StreamActivity.col.actionType, actionType)
  }

  if (userId) {
    q.andWhere(StreamActivity.col.userId, userId)
  }

  return await q
}
