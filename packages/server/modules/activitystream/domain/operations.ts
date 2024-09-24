import { StreamActionType } from '@/modules/activitystream/domain/types'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'

export type GetActivity = (
  streamId: string,
  start: Date,
  end: Date,
  filteredUser: string | null
) => Promise<StreamScopeActivity[]>

export type GetActiveUserStreams = (
  start: Date,
  end: Date
) => Promise<
  {
    userId: string
    streamIds: string[]
  }[]
>

export type GetStreamActivity = (args: {
  streamId: string
  actionType: StreamActionType
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) => Promise<{ items: StreamActivityRecord[]; cursor: string | null }>
