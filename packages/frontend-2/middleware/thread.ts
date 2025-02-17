import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'
import { getLinkToThread } from '~/lib/viewer/helpers/comments'

const resolveLinkQuery = graphql(`
  query ResolveCommentLink($commentId: String!, $projectId: String!) {
    project(id: $projectId) {
      comment(id: $commentId) {
        id
        ...LinkableComment
      }
    }
  }
`)

export default defineNuxtRouteMiddleware(async (to) => {
  const client = useApolloClientFromNuxt()
  const threadId = to.params.threadId as string
  const projectId = to.params.id as string

  const res = await client
    .query({
      query: resolveLinkQuery,
      variables: {
        commentId: threadId,
        projectId
      }
    })
    .catch(convertThrowIntoFetchResult)

  const comment = res.data?.project?.comment
  if (!comment) {
    return abortNavigation(
      createError({
        message: 'Comment thread not found',
        statusCode: 404
      })
    )
  }

  const link = getLinkToThread(projectId, comment)
  if (!link) {
    return abortNavigation(
      createError({
        message: 'Comment thread not found',
        statusCode: 404
      })
    )
  }

  return navigateTo(link)
})
