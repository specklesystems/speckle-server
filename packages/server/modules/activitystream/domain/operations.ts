import { ResourceType, StreamActionType } from '@/modules/activitystream/domain/types'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamAclRecord } from '@/modules/core/helpers/types'

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

export type GetActivityCountByStreamId = ({
  streamId,
  actionType,
  before,
  after
}: {
  streamId: string
  actionType?: StreamActionType
  after?: Date
  before?: Date
}) => Promise<number>

export type GetActivityCountByUserId = ({
  userId,
  actionType,
  before,
  after
}: {
  userId: string
  actionType?: StreamActionType
  after?: Date
  before?: Date
}) => Promise<number>

export type GetTimelineCount = ({
  userId,
  before,
  after
}: {
  userId: string
  after?: Date
  before?: Date
}) => Promise<number>

export type GetActivityCountByResourceId = ({
  resourceId,
  actionType,
  before,
  after
}: {
  resourceId: string
  actionType?: StreamActionType
  after?: Date
  before?: Date
}) => Promise<number>

export type GetUserTimeline = ({
  userId,
  before,
  after,
  cursor,
  limit
}: {
  userId: string
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) => Promise<{
  cursor: string | null
  items: (StreamActivityRecord & StreamAclRecord)[]
}>

export type GetResourceActivity = ({
  resourceType,
  resourceId,
  actionType,
  before,
  after,
  cursor,
  limit
}: {
  resourceType: ResourceType
  resourceId: string
  actionType: StreamActionType
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) => Promise<{
  cursor: string | null
  items: StreamActivityRecord[]
}>
