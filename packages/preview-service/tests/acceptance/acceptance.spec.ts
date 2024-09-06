import { acceptanceTest } from '#/helpers/testExtensions.js'
import { ObjectPreview, type ObjectPreviewRow } from '@/repositories/objectPreview.js'
import { Previews } from '@/repositories/previews.js'
import cryptoRandomString from 'crypto-random-string'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { promises as fs } from 'fs'
import { OBJECTS_TABLE_NAME } from '#/migrations/migrations.js'
import type { Angle } from '@/domain/domain.js'
import { testLogger as logger } from '@/observability/logging.js'

describe.sequential('Acceptance', () => {
  describe.sequential('Run the preview-service image in docker', () => {
    beforeEach(() => {
      // const dbName = inject('dbName')
      logger.info('🤜 running acceptance test before-each')
    })
    afterEach(() => {
      logger.info('🤛 running acceptance test after-each')
    })

    // we use integration test and not e2e test because we don't need the server
    acceptanceTest(
      'loads data, runs docker image, extracts rendered image',
      {
        timeout: 300000 //5 minutes
      },
      async ({ context }) => {
        const { db } = context
        // load data
        const streamId = cryptoRandomString({ length: 10 })
        const objectId = cryptoRandomString({ length: 10 })

        //TODO load object rows from file or sqlite or similar
        const objectRow = {
          id: objectId,
          streamId,
          speckleType: 'Base',
          totalChildrenCount: 0,
          totalChildrenCountByDepth: {},
          data: {}
        }
        await db.batchInsert(OBJECTS_TABLE_NAME, [objectRow])

        const objectPreviewRow = {
          streamId,
          objectId,
          priority: 0,
          previewStatus: 0
        }
        await ObjectPreview({ db }).insert(objectPreviewRow).onConflict().ignore()

        //poll the database until the preview is ready
        let objectPreviewResult: Pick<ObjectPreviewRow, 'preview' | 'previewStatus'>[] =
          []
        while (
          objectPreviewResult.length === 0 ||
          objectPreviewResult[0].previewStatus !== 2
        ) {
          objectPreviewResult = await ObjectPreview({ db })
            .select(['preview', 'previewStatus'])
            .where('streamId', streamId)
            .andWhere('objectId', objectId)

          logger.info(
            { result: objectPreviewResult, streamId, objectId },
            '🔍 Polled object preview for a result for {streamId} and {objectId}'
          )
          // wait a second before polling again
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        const previewData = await Previews({ db })
          .select(['data'])
          .where('id', objectPreviewResult[0].preview['all' as Angle])
          .first()
        logger.info({ previewData }, '🔍 Retrieved preview data')

        if (!previewData) {
          expect(previewData).toBeDefined()
          expect(previewData).not.toBeNull()
          return //HACK to appease typescript
        }

        //TODO use environment variable
        const outputFilePath =
          process.env.OUTPUT_FILE_PATH || '/tmp/preview-service-output.png'
        await fs.writeFile(outputFilePath, previewData.data)
        logger.info({ outputFilePath }, '📝 Saved preview image to {outputFilePath}')
      }
    )
  })
})
