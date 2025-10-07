import type {
  StreamActionTypes,
  StreamResourceTypes,
  StreamScopeActivity
} from '@/modules/activitystream/helpers/types'
import type {
  CommentCreateInput,
  CreateCommentInput,
  CreateCommentReplyInput,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import type { StreamRecord, UserRecord } from '@/modules/core/helpers/types'
import type { ViewerResourceItem } from '@/modules/viewer/domain/types/resources'
import z from 'zod'

// Activity

export type ResourceEventsToPayloadMap = {
  workspace: {
    workspace_plan_created: z.infer<typeof WorkspacePlanCreatedActivity>
    workspace_plan_updated: z.infer<typeof WorkspacePlanUpdatedActivity>
    workspace_subscription_updated: z.infer<typeof WorkspaceSubscriptionUpdatedActivity>
    workspace_seat_updated: z.infer<typeof WorkspaceSeatUpdatedActivity>
    workspace_seat_deleted: z.infer<typeof WorkspaceSeatDeletedActivity>
    workspace_deleted: z.infer<typeof WorkspaceDeletedActivity>
  }
  project: {
    project_role_updated: z.infer<typeof ProjectRoleUpdatedActivity>
    project_role_deleted: z.infer<typeof ProjectRoleDeletedActivity>
  }
}

export interface Activity<
  T extends keyof ResourceEventsToPayloadMap = keyof ResourceEventsToPayloadMap,
  R extends keyof ResourceEventsToPayloadMap[T] = keyof ResourceEventsToPayloadMap[T]
> {
  id: string
  contextResourceId: string
  contextResourceType: T
  eventType: R
  userId: string | null
  payload: ResourceEventsToPayloadMap[T][R]
  createdAt: Date
}

export interface AnyActivity
  extends Activity<
    keyof ResourceEventsToPayloadMap,
    keyof ResourceEventsToPayloadMap[keyof ResourceEventsToPayloadMap]
  > {}

const workspacePlan = z.object({
  name: z.union([
    z.literal('teamUnlimitedInvoiced'),
    z.literal('proUnlimitedInvoiced'),
    z.literal('enterprise'),
    z.literal('unlimited'),
    z.literal('academia'),
    z.literal('free'),
    z.literal('team'),
    z.literal('teamUnlimited'),
    z.literal('pro'),
    z.literal('proUnlimited')
  ]),
  status: z.union([
    z.literal('valid'),
    z.literal('cancelationScheduled'),
    z.literal('canceled'),
    z.literal('paymentFailed')
  ])
})

const workspaceSeat = z.object({
  type: z.union([z.literal('editor'), z.literal('viewer')]),
  userId: z.string()
})

const workspaceSubscription = z.object({
  billingInterval: z.union([z.literal('monthly'), z.literal('yearly')]),
  totalEditorSeats: z.number()
})

const projectRole = z.union([
  z.literal('stream:owner'),
  z.literal('stream:contributor'),
  z.literal('stream:reviewer')
])

export const WorkspacePlanCreatedActivity = z.object({
  version: z.literal('1'),
  new: workspacePlan
})

/**
 * 1 -> 1.1
 * Added
 *  - workspace.totalEditorSeats
 *  - workspace.totalViewerSeats
 */
export const WorkspacePlanUpdatedActivity = z.discriminatedUnion('version', [
  z.object({
    version: z.literal('1'),
    new: workspacePlan,
    old: workspacePlan
  }),
  z.object({
    version: z.literal('1.1'),
    workspace: z.object({
      totalEditorSeats: z.number().int(),
      totalViewerSeats: z.number().int()
    }),
    new: workspacePlan,
    old: workspacePlan
  })
])

export const WorkspaceSubscriptionUpdatedActivity = z.object({
  version: z.literal('1'),
  new: z.intersection(workspacePlan, workspaceSubscription),
  old: z.union([workspacePlan, z.intersection(workspaceSubscription, workspacePlan)])
})

export const workspaceSeatsSnapshot = z.object({
  plan: workspacePlan,
  totalEditorSeats: z.number().int(),
  totalViewerSeats: z.number().int()
})

/**
 * 1 -> 1.1
 * Added
 *  - workspace.totalEditorSeats
 *  - workspace.totalViewerSeats
 *  - workspace.plan
 */
export const WorkspaceSeatUpdatedActivity = z.discriminatedUnion('version', [
  z.object({
    version: z.literal('1'),
    new: workspaceSeat,
    old: z.nullable(workspaceSeat)
  }),
  z.object({
    version: z.literal('1.1'),
    workspace: workspaceSeatsSnapshot,
    new: workspaceSeat,
    old: z.nullable(workspaceSeat)
  })
])

/**
 * 1 -> 1.1
 * Added
 *  - workspace.totalEditorSeats
 *  - workspace.totalViewerSeats
 *  - workspace.plan
 */
export const WorkspaceSeatDeletedActivity = z.discriminatedUnion('version', [
  z.object({
    version: z.literal('1'),
    old: workspaceSeat
  }),
  z.object({
    version: z.literal('1.1'),
    workspace: workspaceSeatsSnapshot,
    old: workspaceSeat
  })
])

/**
 * 1 -> 1.1
 * Added
 *  - workspace.totalEditorSeats
 *  - workspace.totalViewerSeats
 *  - workspace.plan
 */
export const WorkspaceDeletedActivity = z.discriminatedUnion('version', [
  z.object({
    version: z.literal('1')
  }),
  z.object({
    version: z.literal('1.1'),
    workspace: workspaceSeatsSnapshot
  })
])

export const ProjectRoleUpdatedActivity = z.object({
  version: z.literal('1'),
  userId: z.string(),
  new: projectRole,
  old: z.nullable(projectRole)
})

export const ProjectRoleDeletedActivity = z.object({
  version: z.literal('1'),
  userId: z.string(),
  old: projectRole
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
