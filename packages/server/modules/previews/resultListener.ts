import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { throwUncoveredError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'
import crypto from 'crypto'
import {
  BuildConsumePreviewResult,
  ConsumePreviewResult,
  StorePreview,
  UpsertObjectPreview
} from '@/modules/previews/domain/operations'
import { joinImages } from 'join-images'
import { GetObjectCommitsWithStreamIds } from '@/modules/core/domain/commits/operations'
import { PreviewPriority, PreviewStatus } from '@/modules/previews/domain/consts'
import {
  storePreviewFactory,
  upsertObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { getObjectCommitsWithStreamIdsFactory } from '@/modules/core/repositories/commits'

export const buildConsumePreviewResult: BuildConsumePreviewResult = async (deps) => {
  const { logger, projectId } = deps
  const projectDb = await getProjectDbClient({ projectId })
  return consumePreviewResultFactory({
    logger,
    storePreview: storePreviewFactory({ db: projectDb }),
    upsertObjectPreview: upsertObjectPreviewFactory({ db: projectDb }),
    getObjectCommitsWithStreamIds: getObjectCommitsWithStreamIdsFactory({
      db: projectDb
    })
  })
}

export const consumePreviewResultFactory =
  ({
    logger,
    upsertObjectPreview,
    storePreview,
    getObjectCommitsWithStreamIds
  }: {
    logger: Logger
    upsertObjectPreview: UpsertObjectPreview
    storePreview: StorePreview
    getObjectCommitsWithStreamIds: GetObjectCommitsWithStreamIds
  }): ConsumePreviewResult =>
  async ({ projectId, objectId, previewResult }) => {
    const lastUpdate = new Date()
    const priority = PreviewPriority.LOW
    const log = logger.child({
      jobId: previewResult.jobId,
      status: previewResult.status,
      durationSeconds: previewResult.result.durationSeconds,
      projectId,
      streamId: projectId, // for legacy reasons
      objectId
    })

    const previewMessage =
      'Consumed preview generation {status} message payload for {jobId}.'

    switch (previewResult.status) {
      case 'error':
        log.warn({ reason: previewResult.reason }, previewMessage)
        await upsertObjectPreview({
          objectPreview: {
            objectId,
            streamId: projectId,
            lastUpdate,
            preview: { err: previewResult.reason },
            priority,
            previewStatus: PreviewStatus.ERROR
          }
        })
        break

      case 'success':
        log.info(previewMessage)
        const preview: Record<string, string> = {}
        const allImgsArr: Buffer[] = []
        let i = 0
        for (const [angle, value] of Object.entries(previewResult.result.screenshots)) {
          const data = Buffer.from(
            value.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
          )

          // @ts-expect-error this is a mismatch with node 18 and 22 types. upgrading to new node will fix it
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
        // @ts-expect-error this is a mismatch with node 18 and 22 types. upgrading to new node will fix it
        const fullImgId = crypto.createHash('md5').update(buff).digest('hex')

        await storePreview({ preview: { id: fullImgId, data: buff } })

        preview['all'] = fullImgId

        await upsertObjectPreview({
          objectPreview: {
            objectId,
            streamId: projectId,
            lastUpdate,
            preview,
            priority,
            previewStatus: PreviewStatus.DONE
          }
        })
        const commits = await getObjectCommitsWithStreamIds([objectId], {
          streamIds: [projectId]
        })
        if (!commits.length) break

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
        break

      default:
        throwUncoveredError(previewResult)
    }
  }
