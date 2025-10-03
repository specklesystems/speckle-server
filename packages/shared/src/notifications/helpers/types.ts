export enum NotificationType {
  /**
   * @deprecated ActivityDigest will be removed in a future release
   */
  ActivityDigest = 'activityDigest',
  MentionedInComment = 'mentionedInComment',
  NewStreamAccessRequest = 'newStreamAccessRequest',
  StreamAccessRequestApproved = 'streamAccessRequestApproved'
}

export type NotificationPayloadMap = {
  [NotificationType.MentionedInComment]: {
    threadId: string
    authorId: string
    commentId: string
    streamId: string
  }
  [NotificationType.NewStreamAccessRequest]: {
    streamId: string
    requesterId: string
  }
  [NotificationType.StreamAccessRequestApproved]: {
    streamId: string
  }
  [NotificationType.ActivityDigest]: Record<string, unknown>
}
