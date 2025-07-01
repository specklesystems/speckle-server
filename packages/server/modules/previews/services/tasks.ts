import type { Logger } from '@/observability/logging'
import {
  GetPaginatedObjectPreviewsInErrorState,
  GetPaginatedObjectPreviewsPage,
  GetPaginatedObjectPreviewsTotalCount,
  RequestObjectPreview,
  UpdateObjectPreview
} from '@/modules/previews/domain/operations'
import { PreviewPriority, PreviewStatus } from '@/modules/previews/domain/consts'
import { Roles, Scopes, TIME_MS } from '@speckle/shared'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'

export const getPaginatedObjectPreviewInErrorStateFactory =
  (deps: {
    getPaginatedObjectPreviewsPage: GetPaginatedObjectPreviewsPage
    getPaginatedObjectPreviewsTotalCount: GetPaginatedObjectPreviewsTotalCount
  }): GetPaginatedObjectPreviewsInErrorState =>
  async (params) => {
    const [result, totalCount] = await Promise.all([
      deps.getPaginatedObjectPreviewsPage({
        ...params,
        filter: { status: PreviewStatus.ERROR }
      }),
      deps.getPaginatedObjectPreviewsTotalCount({
        ...params,
        filter: { status: PreviewStatus.ERROR }
      })
    ])
    return {
      ...result,
      totalCount
    }
  }

export const retryFailedPreviewsFactory = (deps: {
  getPaginatedObjectPreviewsInErrorState: GetPaginatedObjectPreviewsInErrorState
  updateObjectPreview: UpdateObjectPreview
  getStreamCollaborators: GetStreamCollaborators
  serverOrigin: string
  createAppToken: CreateAndStoreAppToken
  requestObjectPreview: RequestObjectPreview
}) => {
  const {
    getPaginatedObjectPreviewsInErrorState,
    updateObjectPreview,
    getStreamCollaborators,
    serverOrigin,
    createAppToken,
    requestObjectPreview
  } = deps
  return async (params: {
    logger: Logger
    previousCursor: string | null
  }): Promise<{ cursor: string | null }> => {
    const { logger, previousCursor } = params
    const {
      items,
      cursor: newCursor,
      totalCount
    } = await getPaginatedObjectPreviewsInErrorState({
      limit: 1, //get the most recent item that has errored after the cursor
      cursor: previousCursor
    })
    if (items.length === 0) {
      //NOTE we rely on the items returned, as this accounts for the cursor position. More errored items might have been added since the last time we checked and changed the totalCount.
      logger.info('No object previews in error state found. Resetting cursor.')
      // Reset the cursor if we have no items; we have reached the end of the list
      // and can start from the beginning again.
      return { cursor: null }
    }

    const objPreview = items[0]
    const { streamId, objectId } = objPreview

    logger.info(
      {
        totalErroredPreviewCount: totalCount,
        streamId, //legacy
        projectId: streamId,
        objectId
      },
      'Found {totalErroredPreviewCount} object previews in error state. Attempting to retry one: ${projectId}.${objectId}'
    )

    await updateObjectPreview({
      objectPreview: {
        ...objPreview,
        previewStatus: PreviewStatus.PENDING, // move it to pending so it doesn't get picked up again
        priority: PreviewPriority.LOW, // reset the priority to low so it doesn't block other previews
        lastUpdate: new Date() //if this pending item is processed and subsequently errors, this ensures it will be placed behind the cursor so won't be repeated until we reach the end of all errored items and reset the cursor to null
      }
    })

    const owners = await getStreamCollaborators(streamId, Roles.Stream.Owner)
    // there is always an owner, this is safe
    const userId = owners[0].id

    // we're running the preview generation in the name of a project owner
    const token = await createAppToken({
      appId: DefaultAppIds.Web,
      name: `preview-${streamId}@${objectId}`,
      userId,
      scopes: [Scopes.Streams.Read],
      lifespan: 2 * TIME_MS.hour,
      limitResources: [
        {
          id: streamId,
          type: TokenResourceIdentifierType.Project
        }
      ]
    })
    const url = new URL(
      `/projects/${streamId}/models/${objectId}`,
      serverOrigin
    ).toString()

    await requestObjectPreview({ jobId: `${streamId}.${objectId}`, token, url })

    return { cursor: newCursor }
  }
}
