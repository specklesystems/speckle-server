import { Comment } from './types.js'

export type GetComment = (args: {
  commentId: string
  projectId: string
}) => Promise<Comment | null>
