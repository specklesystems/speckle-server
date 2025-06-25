import {
  StreamActionTypes,
  StreamResourceTypes,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import { ViewerResourceItem } from '@/modules/comments/domain/types'
import {
  CommentCreateInput,
  CreateCommentInput,
  CreateCommentReplyInput,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRecord, UserRecord } from '@/modules/core/helpers/types'

// Activity

type WorkspacePlanSnapshot = {
  name: string
  status: string
}

export type WorkspacePlanUpdatedActivity = {
  version: '1'
  new: WorkspacePlanSnapshot
  old?: WorkspacePlanSnapshot
}

type WorkspaceBillingSnapshot = WorkspacePlanSnapshot & {
  billingInterval: string
  totalEditorSeats: number
}

export type WorkspaceSubscriptionUpdatedActivity = {
  version: '1'
  new: WorkspaceBillingSnapshot
  old?: WorkspaceBillingSnapshot
}

// Stream Activity

export type StreamActionType =
  (typeof StreamActionTypes.Stream)[keyof (typeof StreamActionTypes)['Stream']]

export type ResourceType =
  (typeof StreamResourceTypes)[keyof typeof StreamResourceTypes]

export type StreamActivitySummary = {
  stream: StreamRecord | null
  activity: StreamScopeActivity[]
}

export type ActivitySummary = {
  user: UserRecord
  streamActivities: StreamActivitySummary[]
}

export type CommentCreatedActivityInput =
  | CommentCreateInput
  | (CreateCommentInput & { resolvedResourceItems?: ViewerResourceItem[] })

export type ReplyCreatedActivityInput = ReplyCreateInput | CreateCommentReplyInput
