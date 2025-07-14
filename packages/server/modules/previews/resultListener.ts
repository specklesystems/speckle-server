import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'
import { publish } from '@/modules/shared/utils/subscriptions'
import { ensureError, throwUncoveredError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'
import crypto from 'crypto'
import type {
  ConsumePreviewResult,
  StorePreview,
  UpdateObjectPreview
} from '@/modules/previews/domain/operations'
import { joinImages } from 'join-images'
import type { GetObjectCommitsWithStreamIds } from '@/modules/core/domain/commits/operations'
import { PreviewStatus } from '@/modules/previews/domain/consts'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  PreviewErrorPayload,
  PreviewSuccessPayload
} from '@speckle/shared/workers/previews'

const previewMessage =
  'Consumed preview generation {status} message payload for {jobId}.'

export const consumePreviewResultFactory =
  ({
    logger,
    updateObjectPreview,
    storePreview,
    getObjectCommitsWithStreamIds
  }: {
    logger: Logger
    updateObjectPreview: UpdateObjectPreview
    storePreview: StorePreview
    getObjectCommitsWithStreamIds: GetObjectCommitsWithStreamIds
  }): ConsumePreviewResult =>
  async ({ projectId, objectId, previewResult }) => {
    const log = logger.child({
      jobId: previewResult.jobId,
      status: previewResult.status,
      durationSeconds: previewResult.result.durationSeconds,
      projectId,
      streamId: projectId, // for legacy reasons
      objectId
    })

    const processErrorResult = processErrorResultFactory({
      updateObjectPreview,
      logger: log
    })
    const processSuccessResult = processSuccessResultFactory({
      storePreview,
      getObjectCommitsWithStreamIds,
      updateObjectPreview,
      logger: log
    })

    try {
      switch (previewResult.status) {
        case 'error':
          await processErrorResult({ previewResult, objectId, projectId })
          break

        case 'success':
          await processSuccessResult({ previewResult, objectId, projectId })
          break

        default:
          throwUncoveredError(previewResult)
      }
    } catch (e) {
      const err = ensureError(e, 'Unknown error when consuming preview result')
      switch (err.name) {
        case StreamNotFoundError.name:
          logger.warn(
            { err },
            'Failed to consume preview result; the stream does not exist. Probably deleted while the preview was being generated.'
          )
          break
        default:
          logger.error({ err }, 'Failed to consume preview result')
      }
    }
  }

const processErrorResultFactory = (deps: {
  updateObjectPreview: UpdateObjectPreview
  logger: Logger
}) => {
  const { logger, updateObjectPreview } = deps
  return async (params: {
    previewResult: PreviewErrorPayload
    projectId: string
    objectId: string
  }) => {
    const { previewResult, projectId, objectId } = params
    logger.warn({ reason: previewResult.reason }, previewMessage)
    await updateObjectPreview({
      objectPreview: {
        objectId,
        streamId: projectId,
        lastUpdate: new Date(),
        preview: { err: previewResult.reason },
        previewStatus: PreviewStatus.ERROR
      }
    })
  }
}

const processSuccessResultFactory = (deps: {
  storePreview: StorePreview
  updateObjectPreview: UpdateObjectPreview
  getObjectCommitsWithStreamIds: GetObjectCommitsWithStreamIds
  logger: Logger
}) => {
  const { storePreview, getObjectCommitsWithStreamIds, updateObjectPreview, logger } =
    deps
  return async (params: {
    objectId: string
    projectId: string
    previewResult: PreviewSuccessPayload
  }) => {
    const { previewResult, projectId, objectId } = params
    logger.info(previewMessage)
    const preview: Record<string, string> = {}
    const allImgsArr: Buffer[] = []
    let i = 0
    for (const [angle, value] of Object.entries(previewResult.result.screenshots)) {
      const data = Buffer.from(value.replace(/^data:image\/\w+;base64,/, ''), 'base64')

      const id = crypto.createHash('md5').update(data).digest('hex')

      if (i++ === 0) {
        await storePreview({ preview: { id, data } })
        preview[angle] = id
      }

      allImgsArr.push(data)
    }

    const fullImg = await joinImages(allImgsArr, {
      direction: 'horizontal',
      offset: 700,
      margin: '0 700 0 700',
      color: { alpha: 0, r: 0, g: 0, b: 0 }
    })
    const png = fullImg.png({ quality: 95 })
    const buff = await png.toBuffer()
    const fullImgId = crypto.createHash('md5').update(buff).digest('hex')

    await storePreview({ preview: { id: fullImgId, data: buff } })

    preview['all'] = fullImgId

    await updateObjectPreview({
      objectPreview: {
        objectId,
        streamId: projectId,
        lastUpdate: new Date(),
        preview,
        previewStatus: PreviewStatus.DONE
      }
    })
    const commits = await getObjectCommitsWithStreamIds([objectId], {
      streamIds: [projectId]
    })
    if (!commits.length) return

    await Promise.all(
      commits.map((c) =>
        publish(ProjectSubscriptions.ProjectVersionsPreviewGenerated, {
          projectVersionsPreviewGenerated: {
            versionId: c.id,
            projectId: c.streamId,
            objectId
          }
        })
      )
    )
  }
}
