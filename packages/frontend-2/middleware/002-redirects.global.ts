import { SpeckleViewer, type Optional } from '@speckle/shared'
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
import type { EmbedOptions } from '~/lib/viewer/composables/setup/embed'
import { ViewerHashStateKeys } from '~/lib/viewer/composables/setup/urlHashState'

const legacyBranchMetadataQuery = graphql(`
  query LegacyBranchRedirectMetadata($streamId: String!, $branchName: String!) {
    project(id: $streamId) {
      modelByName(name: $branchName) {
        id
      }
    }
  }
`)

const legacyViewerCommitMetadataQuery = graphql(`
  query LegacyViewerCommitRedirectMetadata($streamId: String!, $commitId: String!) {
    project(id: $streamId) {
      version(id: $commitId) {
        id
        model {
          id
        }
      }
    }
  }
`)

const legacyViewerStreamMetadataQuery = graphql(`
  query LegacyViewerStreamRedirectMetadata($streamId: String!) {
    project(id: $streamId) {
      id
      versions(limit: 1) {
        totalCount
        items {
          id
          model {
            id
          }
        }
      }
    }
  }
`)

const viewerPageRgx =
  /^\/streams\/([a-zA-Z0-9-_]+)\/(commits|objects)\/([a-zA-Z0-9-_]+)\/?/

const embedViewerPageRgx = /^\/embed\/?/

const streamBranchPageRgx =
  /^\/streams\/([a-zA-Z0-9-_]+)\/branches\/([a-zA-Z0-9-_%]+)\/?/

const streamPageRgx = /^\/streams\/([a-zA-Z0-9-_]+)\/?/
const adminPageRgx = /^\/admin\/?/

/**
 * Setting up all kinds of redirects (e.g. for FE1 backwards compatibility)
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const logger = useLogger()
  const path = to.path
  const apollo = useApolloClientFromNuxt()
  const resourceBuilder = () => SpeckleViewer.ViewerRoute.resourceBuilder()

  if (['/streams', '/commits'].includes(path)) {
    return navigateTo(homeRoute)
  }

  const [, viewerStreamId, viewerType, viewerId] = path.match(viewerPageRgx) || []
  if (viewerStreamId && viewerType && viewerId) {
    const resourceIdStringBuilder = resourceBuilder()

    // Resolve comment ID, if any
    const commentId = to.query['cId'] as Optional<string>
    const hashState: Optional<Partial<Record<ViewerHashStateKeys, string>>> =
      commentId?.length
        ? { [ViewerHashStateKeys.FocusedThreadId]: commentId }
        : undefined

    if (viewerType === 'objects') {
      const resourceIdString = resourceIdStringBuilder.addObject(viewerId).toString()
      return navigateTo(modelRoute(viewerStreamId, resourceIdString, hashState))
    } else {
      const { data, errors } = await apollo
        .query({
          query: legacyViewerCommitMetadataQuery,
          variables: { streamId: viewerStreamId, commitId: viewerId }
        })
        .catch(convertThrowIntoFetchResult)
      const branchId = data?.project?.version?.model?.id

      if (branchId) {
        return navigateTo(
          modelRoute(
            viewerStreamId,
            resourceIdStringBuilder.addModel(branchId, viewerId).toString(),
            hashState
          )
        )
      } else {
        logger.warn(
          {
            errors,
            streamId: viewerStreamId,
            commitId: viewerId
          },
          "Couldn't resolve legacy viewer redirect commit metadata"
        )
        return navigateTo(projectRoute(viewerStreamId))
      }
    }
  }

  const isEmbed = embedViewerPageRgx.test(path)
  if (isEmbed) {
    const embedOptions: EmbedOptions = {
      isEnabled: true,
      ...(to.query['transparent'] === 'true' ? { isTransparent: true } : {}),
      ...(to.query['hidecontrols'] === 'true' ? { hideControls: true } : {}),
      ...(to.query['hideselectioninfo'] === 'true' ? { hideSelectionInfo: true } : {}),
      ...(to.query['noscroll'] === 'true' ? { noScroll: true } : {}),
      ...(to.query['autoload'] === 'true'
        ? { manualLoad: false }
        : { manualLoad: true })
    }

    // Resolve stream/object/commit ID from query
    const streamId = to.query['stream'] as Optional<string> // get first stream commit
    const commitId = to.query['commit'] as Optional<string> // get specific commit
    const objectId = to.query['object'] as Optional<string> // get specific object
    const branchName = to.query['branch'] as Optional<string> // get first branch commit

    if (!streamId?.length) {
      logger.warn('No stream ID provided for embed viewer redirect')
      return navigateTo(homeRoute)
    }

    if (objectId?.length) {
      return navigateTo(
        modelRoute(streamId, resourceBuilder().addObject(objectId).toString(), {
          [ViewerHashStateKeys.EmbedOptions]: JSON.stringify(embedOptions)
        })
      )
    } else if (commitId?.length) {
      const { data, errors } = await apollo
        .query({
          query: legacyViewerCommitMetadataQuery,
          variables: { streamId, commitId }
        })
        .catch(convertThrowIntoFetchResult)
      const branchId = data?.project?.version?.model?.id

      if (branchId) {
        return navigateTo(
          modelRoute(
            streamId,
            resourceBuilder().addModel(branchId, commitId).toString(),
            {
              [ViewerHashStateKeys.EmbedOptions]: JSON.stringify(embedOptions)
            }
          )
        )
      } else {
        logger.warn(
          {
            errors,
            streamId,
            commitId
          },
          "Couldn't resolve legacy commit embed redirect metadata"
        )
        return navigateTo(projectRoute(streamId))
      }
    } else if (branchName?.length) {
      const { data, errors } = await apollo
        .query({
          query: legacyBranchMetadataQuery,
          variables: {
            streamId,
            branchName: decodeURIComponent(branchName)
          }
        })
        .catch(convertThrowIntoFetchResult)

      const branchId = data?.project?.modelByName?.id
      if (branchId) {
        return navigateTo(
          modelRoute(streamId, resourceBuilder().addModel(branchId).toString(), {
            [ViewerHashStateKeys.EmbedOptions]: JSON.stringify(embedOptions)
          })
        )
      } else {
        logger.warn(
          {
            errors,
            streamId,
            branchName: decodeURIComponent(branchName)
          },
          "Couldn't resolve legacy branch embed redirect metadata"
        )
        return navigateTo(projectRoute(streamId))
      }
    } else {
      const { data, errors } = await apollo
        .query({ query: legacyViewerStreamMetadataQuery, variables: { streamId } })
        .catch(convertThrowIntoFetchResult)

      if (
        data?.project?.versions?.items?.length &&
        data.project.versions.items[0].model
      ) {
        return navigateTo(
          modelRoute(
            data.project.id,
            SpeckleViewer.ViewerRoute.resourceBuilder()
              .addModel(
                data.project.versions.items[0].model.id,
                data.project.versions.items[0].id
              )
              .toString(),
            {
              [ViewerHashStateKeys.EmbedOptions]: JSON.stringify(embedOptions)
            }
          )
        )
      } else {
        logger.warn(
          {
            errors,
            streamId
          },
          "Couldn't resolve legacy stream embed redirect metadata"
        )
        return navigateTo(projectRoute(streamId))
      }
    }
  }

  const [, branchStreamId, branchName] = path.match(streamBranchPageRgx) || []
  if (branchStreamId && branchName) {
    const { data, errors } = await apollo
      .query({
        query: legacyBranchMetadataQuery,
        variables: {
          streamId: branchStreamId,
          branchName: decodeURIComponent(branchName)
        }
      })
      .catch(convertThrowIntoFetchResult)
    const branchId = data?.project?.modelByName?.id

    if (branchId) {
      return navigateTo(modelVersionsRoute(branchStreamId, branchId))
    } else {
      logger.warn(
        {
          errors,
          streamId: branchStreamId,
          branchName: decodeURIComponent(branchName)
        },
        "Couldn't resolve legacy branch redirect metadata"
      )

      return navigateTo(projectRoute(branchStreamId))
    }
  }

  const [, streamId] = path.match(streamPageRgx) || []
  if (streamId) {
    return navigateTo(projectRoute(streamId))
  }

  if (adminPageRgx.test(path)) {
    return navigateTo(serverManagementRoute)
  }
})
