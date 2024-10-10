import {
  ActivitySummary,
  ResourceType,
  StreamActionType
} from '@/modules/activitystream/domain/types'
import {
  StreamActivityRecord,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'

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

export type GetUserActivity = ({
  userId,
  actionType,
  before,
  after,
  cursor,
  limit
}: {
  userId: string
  actionType: StreamActionType
  after?: Date
  before?: Date
  cursor?: Date
  limit?: number
}) => Promise<{
  cursor: string | null
  items: StreamActivityRecord[]
}>

export type SaveActivity = (args: Omit<StreamActivityRecord, 'time'>) => Promise<void>

export type CreateActivitySummary = (args: {
  userId: string
  streamIds: string[]
  start: Date
  end: Date
}) => Promise<ActivitySummary | null>

export type AddStreamCommentMentionActivity = (params: {
  streamId: string
  mentionAuthorId: string
  mentionTargetId: string
  commentId: string
  threadId: string
}) => Promise<void>

export type AddStreamInviteDeclinedActivity = (params: {
  streamId: string
  inviteTargetId: string
  inviterId: string
  stream: StreamRecord
}) => Promise<void>

export type AddStreamInviteSentOutActivity = (params: {
  streamId: string
  inviteTargetId: string | null
  inviterId: string
  inviteTargetEmail: string | null
  stream: StreamRecord
}) => Promise<void>

export type AddStreamDeletedActivity = (params: {
  streamId: string
  deleterId: string
}) => Promise<void>
