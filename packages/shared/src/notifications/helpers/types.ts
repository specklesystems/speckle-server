export enum NotificationType {
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
}
