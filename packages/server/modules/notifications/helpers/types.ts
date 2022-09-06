/* eslint-disable @typescript-eslint/no-explicit-any */
import { StreamAccessRequestRecord } from '@/modules/accessrequests/repositories'
import { MaybeAsync, Optional } from '@/modules/shared/helpers/typeHelper'
import { Job } from 'bull'
import debug from 'debug'
import { isObject, has } from 'lodash'

export enum NotificationType {
  MentionedInComment = 'mentioned-in-comment',
  NewStreamAccessRequest = 'new-stream-access-request',
  StreamAccessRequestApproved = 'stream-access-request-approved'
}

// Add mappings between NotificationTypes and expected Message types here
export type NotificationTypeMessageMap = {
  [NotificationType.MentionedInComment]: MentionedInCommentMessage
  [NotificationType.NewStreamAccessRequest]: NewStreamAccessRequestMessage
  [NotificationType.StreamAccessRequestApproved]: StreamAccessRequestApprovedMessage
} & { [k in NotificationType]: unknown }

export type NotificationMessage<
  T extends NotificationType = any,
  P extends Optional<Record<string, unknown>> = any
> = {
  targetUserId: string
  type: T
  data: P
}

export type NotificationHandler<M extends NotificationMessage = NotificationMessage> = (
  msg: M,
  extra: {
    job: Job
    debug: debug.Debugger
  }
) => MaybeAsync<void>

// Mapping between all notification type values and their corresponding handler types
export type NotificationTypeHandlers = {
  [k in NotificationType]: NotificationHandler<NotificationTypeMessageMap[k]>
}

export const isNotificationMessage = (msg: unknown): msg is NotificationMessage =>
  isObject(msg) && has(msg, 'targetUserId') && has(msg, 'type') && has(msg, 'data')

export type MentionedInCommentData = {
  threadId: string
  commentId: string
  authorId: string
  streamId: string
}

export type MentionedInCommentMessage = NotificationMessage<
  NotificationType.MentionedInComment,
  MentionedInCommentData
>

export type NewStreamAccessRequestData = { requestId: string }

export type NewStreamAccessRequestMessage = NotificationMessage<
  NotificationType.NewStreamAccessRequest,
  NewStreamAccessRequestData
>

export type StreamAccessRequestApprovedData = {
  /**
   * Approved (and since then deleted) request object
   */
  request: StreamAccessRequestRecord
  /**
   * ID of user who finalized the request
   */
  finalizedBy: string
}

export type StreamAccessRequestApprovedMessage = NotificationMessage<
  NotificationType.StreamAccessRequestApproved,
  StreamAccessRequestApprovedData
>
