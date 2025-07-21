import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import { keyBy } from 'lodash-es'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import {
  getCommentParentsFactory,
  getCommentReplyAuthorIdsFactory,
  getCommentReplyCountsFactory,
  getCommentsFactory,
  getCommentsResourcesFactory,
  getCommentsViewedAtFactory
} from '@/modules/comments/repositories/comments'

import { CommentRecord } from '@/modules/comments/helpers/types'

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders extends ReturnType<typeof dataLoadersDefinition> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ ctx, createLoader, deps: { db } }) => {
    const userId = ctx.userId

    const getCommentsResources = getCommentsResourcesFactory({ db })
    const getCommentsViewedAt = getCommentsViewedAtFactory({ db })
    const getCommentReplyCounts = getCommentReplyCountsFactory({ db })
    const getCommentReplyAuthorIds = getCommentReplyAuthorIdsFactory({ db })
    const getCommentParents = getCommentParentsFactory({ db })
    const getComments = getCommentsFactory({ db })

    return {
      comments: {
        getComment: createLoader<string, Nullable<CommentRecord>>(
          async (commentIds) => {
            const results = keyBy(await getComments({ ids: commentIds.slice() }), 'id')
            return commentIds.map((id) => results[id] || null)
          }
        ),
        getViewedAt: createLoader<string, Nullable<Date>>(async (commentIds) => {
          if (!userId) return commentIds.slice().map(() => null)

          const results = keyBy(
            await getCommentsViewedAt(commentIds.slice(), userId),
            'commentId'
          )
          return commentIds.map((id) => results[id]?.viewedAt || null)
        }),
        getResources: createLoader<string, ResourceIdentifier[]>(async (commentIds) => {
          const results = await getCommentsResources(commentIds.slice())
          return commentIds.map((id) => results[id]?.resources || [])
        }),
        getReplyCount: createLoader<string, number>(async (threadIds) => {
          const results = keyBy(
            await getCommentReplyCounts(threadIds.slice()),
            'threadId'
          )
          return threadIds.map((id) => results[id]?.count || 0)
        }),
        getReplyAuthorIds: createLoader<string, string[]>(async (threadIds) => {
          const results = await getCommentReplyAuthorIds(threadIds.slice())
          return threadIds.map((id) => results[id] || [])
        }),
        getReplyParent: createLoader<string, Nullable<CommentRecord>>(
          async (replyIds) => {
            const results = keyBy(await getCommentParents(replyIds.slice()), 'replyId')
            return replyIds.map((id) => results[id] || null)
          }
        )
      }
    }
  }
)

export default dataLoadersDefinition
