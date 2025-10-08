import type { Logger } from '@/observability/logging'
import type {
  GetNumberOfJobsInRequestQueue,
  GetPaginatedObjectPreviewsInErrorState,
  GetPaginatedObjectPreviewsPage,
  GetPaginatedObjectPreviewsTotalCount,
  RequestObjectPreview,
  UpdateObjectPreview
} from '@/modules/previews/domain/operations'
import { PreviewStatus } from '@/modules/previews/domain/consts'
import { Roles, Scopes, TIME_MS } from '@speckle/shared'
import { DefaultAppIds } from '@/modules/auth/defaultApps'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import type { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import type { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { getPreviewServiceMaxQueueBackpressure } from '@/modules/shared/helpers/envHelper'

export const getPaginatedObjectPreviewInErrorStateFactory =
  (deps: {
    getPaginatedObjectPreviewsPage: GetPaginatedObjectPreviewsPage
    getPaginatedObjectPreviewsTotalCount: GetPaginatedObjectPreviewsTotalCount
    maximumNumberOfAttempts?: number
  }): GetPaginatedObjectPreviewsInErrorState =>
  async (params) => {
    const filter = {
      status: PreviewStatus.ERROR,
      maxNumberOfAttempts: deps.maximumNumberOfAttempts ?? 3 // only retry items that have errored less than 3 times
    }
    const [result, totalCount] = await Promise.all([
      deps.getPaginatedObjectPreviewsPage({
        ...params,
        filter
      }),
      deps.getPaginatedObjectPreviewsTotalCount({
        ...params,
        filter
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
  getNumberOfJobsInQueue: GetNumberOfJobsInRequestQueue
  region: string
}) => {
  const {
    getPaginatedObjectPreviewsInErrorState,
    updateObjectPreview,
    getStreamCollaborators,
    serverOrigin,
    createAppToken,
    requestObjectPreview,
    getNumberOfJobsInQueue,
    region
  } = deps
  return async (params: { logger: Logger }): Promise<boolean> => {
    const { logger } = params
    const { items, totalCount } = await getPaginatedObjectPreviewsInErrorState({
      limit: 1, //get the least recent item that has errored
      cursor: null // always get the first item
    })
    if (items.length === 0) {
      //NOTE we rely on the items returned, as this accounts for the cursor position. More errored items might have been added since the last time we checked and changed the totalCount.
      logger.info(
        { region },
        "No object previews in an error state were found within database region '{region}'"
      )
      return false
    }

    // do not retry if we have backpressure in the queue
    const queueLength = await getNumberOfJobsInQueue()
    if (queueLength > getPreviewServiceMaxQueueBackpressure()) {
      logger.info(
        { region, queueLength, totalErroredPreviewCount: totalCount },
        "Backpressure detected in the preview request queue, as the queue length is already {queueLength} jobs. Found {totalErroredPreviewCount} object previews in an error state within database region '{region}', but are not retrying any on this iteration."
      )
      return false
    }

    const objPreview = items[0]
    const { streamId, objectId } = objPreview

    logger.info(
      {
        totalErroredPreviewCount: totalCount,
        streamId, //legacy
        projectId: streamId,
        objectId,
        attempts: objPreview.attempts,
        region
      },
      "Found {totalErroredPreviewCount} object previews in an error state within database region '{region}'. Attempting to retry one: {projectId}.{objectId}. Previous attempts: {attempts}"
    )

    await updateObjectPreview({
      objectPreview: {
        ...objPreview,
        previewStatus: PreviewStatus.PENDING, // move it to pending so it doesn't get picked up again
        incrementAttempts: true // increment the number of attempts
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

    return true
  }
}
