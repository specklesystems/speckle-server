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
import z from 'zod'

// Activity

export type ResourceEventsToPayloadMap = {
  workspace: {
    workspace_plan_created: z.infer<typeof WorkspacePlanCreatedActivity>
    workspace_plan_updated: z.infer<typeof WorkspacePlanUpdatedActivity>
    workspace_subscription_updated: z.infer<typeof WorkspaceSubscriptionUpdatedActivity>
  }
}

export const WorkspacePlanCreatedActivity = z.object({
  version: z.literal('1'),
  new: z.object({
    name: z.string(),
    status: z.string()
  })
})

export const WorkspacePlanUpdatedActivity = z.object({
  version: z.literal('1'),
  new: z.object({
    name: z.string(),
    status: z.string()
  }),
  old: z.object({
    name: z.string(),
    status: z.string()
  })
})

export const WorkspaceSubscriptionUpdatedActivity = z.object({
  version: z.literal('1'),
  new: z.object({
    name: z.string(),
    status: z.string(),
    billingInterval: z.string(),
    totalEditorSeats: z.number()
  }),
  old: z.union([
    z.object({
      name: z.string(),
      status: z.string()
    }),
    z.object({
      name: z.string(),
      status: z.string(),
      billingInterval: z.string(),
      totalEditorSeats: z.number()
    })
  ])
})

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
