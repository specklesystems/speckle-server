/* eslint-disable @typescript-eslint/no-explicit-any */
import { MaybeAsync, Optional } from '@/modules/shared/helpers/typeHelper'
import debug from 'debug'
import { isObject, has } from 'lodash'
import { Message } from 'redis-smq'

export enum NotificationType {
  MentionedInComment = 'mentioned-in-comment',
  Test = 'test'
}

// Add mappings between NotificationTypes and expected Message types here
export type NotificationTypeMessageMap = {
  [NotificationType.MentionedInComment]: MentionedInCommentMessage
  [NotificationType.Test]: TestMessage
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
    wrapperMessage: Message
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

export type TestMessageData = Record<string, unknown>
export type TestMessage = NotificationMessage<NotificationType.Test, TestMessageData>
