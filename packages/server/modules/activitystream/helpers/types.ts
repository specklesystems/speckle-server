import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type StreamActivityRecord = {
  streamId: Nullable<string>
  time: Date
  resourceType: Nullable<(typeof ResourceTypes)[keyof typeof ResourceTypes]>
  resourceId: Nullable<string>
  actionType: AllActivityTypes
  userId: Nullable<string>
  info: Nullable<Record<string, unknown>>
  message: Nullable<string>
}

export const ResourceTypes = Object.freeze(<const>{
  User: 'user',
  Stream: 'stream',
  Commit: 'commit',
  Branch: 'branch',
  Comment: 'comment'
})

/**
 * User activity type constants
 */
export const ActionTypes = Object.freeze(<const>{
  Stream: {
    Update: 'stream_update',
    PermissionsRemove: 'stream_permissions_remove',
    PermissionsAdd: 'stream_permissions_add',
    InviteAccepted: 'stream_permissions_invite_accepted',
    Delete: 'stream_delete',
    Create: 'stream_create',
    Clone: 'stream_clone',
    InviteSent: 'stream_invite_sent',
    InviteDeclined: 'stream_invite_declined',
    AccessRequestSent: 'stream_access_request_sent',
    AccessRequestDeclined: 'stream_access_request_declined'
  },
  Comment: {
    Create: 'comment_created',
    Archive: 'comment_archived',
    Reply: 'comment_replied',
    Mention: 'comment_mention'
  },
  Branch: {
    Create: 'branch_create',
    Update: 'branch_update',
    Delete: 'branch_delete'
  },
  Commit: {
    Create: 'commit_create',
    Update: 'commit_update',
    Receive: 'commit_receive',
    Delete: 'commit_delete',
    Move: 'commit_move'
  },
  User: {
    Create: 'user_create',
    Update: 'user_update',
    Delete: 'user_delete'
  }
})

export type StreamActivityType =
  (typeof ActionTypes)['Stream'][keyof (typeof ActionTypes)['Stream']]

export type CommentActivityType =
  (typeof ActionTypes)['Comment'][keyof (typeof ActionTypes)['Comment']]

export type BranchActivityType =
  (typeof ActionTypes)['Branch'][keyof (typeof ActionTypes)['Branch']]

export type CommitActivityType =
  (typeof ActionTypes)['Commit'][keyof (typeof ActionTypes)['Commit']]

export type UserActivityType =
  (typeof ActionTypes)['User'][keyof (typeof ActionTypes)['User']]

export type AllActivityTypes =
  | StreamActivityType
  | CommentActivityType
  | BranchActivityType
  | CommitActivityType
  | UserActivityType

// export interface Activity {
//   streamId: string | null
//   time: Date
//   resourceType: typeof ResourceTypes[keyof typeof ResourceTypes]
//   resourceId: string
//   actionType: AllActivityTypes
//   userId: string
//   info: Record<string, unknown>
//   message: string
// }

export interface StreamScopeActivity extends StreamActivityRecord {
  streamId: string
}

export interface StreamActivity extends StreamScopeActivity {
  streamId: string
  resourceType: 'stream'
  actionType: StreamActivityType
}

export interface CommentActivity extends StreamScopeActivity {
  streamId: string
  resourceType: 'comment'
  actionType: CommentActivityType
}

export interface BranchActivity extends StreamScopeActivity {
  streamId: string
  resourceType: 'branch'
  actionType: BranchActivityType
}

export interface CommitActivity extends StreamScopeActivity {
  streamId: string
  resourceType: 'commit'
  actionType: CommitActivityType
}

export interface UserActivity extends StreamActivityRecord {
  resourceType: 'user'
  actionType: UserActivityType
}
