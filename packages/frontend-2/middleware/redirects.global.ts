import { SpeckleViewer } from '@speckle/shared'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { convertThrowIntoFetchResult } from '~/lib/common/helpers/graphql'
import {
  homeRoute,
  modelRoute,
  modelVersionsRoute,
  projectRoute,
  serverManagementRoute
} from '~/lib/common/helpers/route'

const legacyBranchMetadataQuery = graphql(`
  query LegacyBranchRedirectMetadata($streamId: String!, $branchName: String!) {
    stream(id: $streamId) {
      branch(name: $branchName) {
        id
      }
    }
  }
`)

const legacyViewerCommitMetadataQuery = graphql(`
  query LegacyViewerCommitRedirectMetadata($streamId: String!, $commitId: String!) {
    stream(id: $streamId) {
      commit(id: $commitId) {
        id
        branch {
          id
        }
      }
    }
  }
`)

/**
 * Setting up all kinds of redirects (e.g. for FE1 backwards compatibility)
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const path = to.path
  const apollo = useApolloClientFromNuxt()

  if (['/streams', '/commits'].includes(path)) {
    return navigateTo(homeRoute)
  }

  const viewerPageRgx =
    /^\/streams\/([a-zA-Z0-9-_]+)\/(commits|objects)\/([a-zA-Z0-9-_]+)\/?/

  const [, viewerStreamId, viewerType, viewerId] = path.match(viewerPageRgx) || []
  if (viewerStreamId && viewerType && viewerId) {
    const resourceIdStringBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()

    if (viewerType === 'objects') {
      const resourceIdString = resourceIdStringBuilder.addObject(viewerId).toString()
      return navigateTo(modelRoute(viewerStreamId, resourceIdString))
    } else {
      const { data } = await apollo
        .query({
          query: legacyViewerCommitMetadataQuery,
          variables: { streamId: viewerStreamId, commitId: viewerId }
        })
        .catch(convertThrowIntoFetchResult)
      const branchId = data?.stream?.commit?.branch?.id

      return navigateTo(
        branchId
          ? modelRoute(
              viewerStreamId,
              resourceIdStringBuilder.addModel(branchId, viewerId).toString()
            )
          : projectRoute(viewerStreamId)
      )
    }
  }

  const streamBranchPageRgx =
    /^\/streams\/([a-zA-Z0-9-_]+)\/branches\/([a-zA-Z0-9-_%]+)\/?/

  const [, branchStreamId, branchName] = path.match(streamBranchPageRgx) || []
  if (branchStreamId && branchName) {
    const { data } = await apollo
      .query({
        query: legacyBranchMetadataQuery,
        variables: {
          streamId: branchStreamId,
          branchName: decodeURIComponent(branchName)
        }
      })
      .catch(convertThrowIntoFetchResult)
    const branchId = data?.stream?.branch?.id

    return navigateTo(
      branchId
        ? modelVersionsRoute(branchStreamId, branchId)
        : projectRoute(branchStreamId)
    )
  }

  const streamPageRgx = /^\/streams\/([a-zA-Z0-9-_]+)\/?/
  const [, streamId] = path.match(streamPageRgx) || []
  if (streamId) {
    return navigateTo(projectRoute(streamId))
  }

  const adminPageRgx = /^\/admin\/?/
  if (adminPageRgx.test(path)) {
    return navigateTo(serverManagementRoute)
  }
})
