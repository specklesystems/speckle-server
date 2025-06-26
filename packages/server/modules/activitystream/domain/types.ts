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

export type ResourceEventsToPayloadMap = {
  workspace: {
    workspace_plan_upgraded: WorkspacePlanUpdatedActivity
    workspace_subscription_upgraded: WorkspaceSubscriptionUpdatedActivity
  }
}

export type WorkspacePlanUpdatedActivity = {
  version: '1'
  new: {
    name: string
    status: string
  }
  old: {
    name: string
    status: string
  } | null
}

export type WorkspaceSubscriptionUpdatedActivity = {
  version: '1'
  new: {
    name: string
    status: string
    billingInterval: string
    totalEditorSeats: number
  }
  old?: {
    name: string
    status: string
    billingInterval: string
    totalEditorSeats: number
  }
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
