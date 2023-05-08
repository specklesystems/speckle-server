import { CommentRecord } from '@/modules/comments/helpers/types'

/**
 * The types of objects we return in resolvers often don't have the exact type as the object in the schema.
 * Often some fields will be missing, because they are defined as separate resolvers and thus don't need
 * to be defined on the object being returned.
 *
 * These are registered in the server's codegen.yml
 */

export type CommentReplyAuthorCollectionGraphQLReturn = {
  totalCount: number
  authorIds: string[]
}

export type CommentGraphQLReturn = CommentRecord
