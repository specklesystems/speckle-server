import { acceptanceTest } from '#/helpers/testExtensions.js'
import { ObjectPreview, type ObjectPreviewRow } from '@/repositories/objectPreview.js'
import { Previews } from '@/repositories/previews.js'
import cryptoRandomString from 'crypto-random-string'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { promises as fs } from 'fs'
import { OBJECTS_TABLE_NAME } from '#/migrations/migrations.js'
import type { Angle } from '@/domain/domain.js'
import { testLogger as logger } from '@/observability/logging.js'

import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3'

const getS3Config = () => {
  return {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    },
    endpoint: process.env.S3_ENDPOINT || '',
    forcePathStyle: true,
    // s3ForcePathStyle: true,
    // signatureVersion: 'v4',
    region: process.env.S3_REGION || 'us-east-1'
  }
}

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

        if (!process.env.OUTPUT_FILE_PATH)
          throw new Error('OUTPUT_FILE_PATH environment variable not set')

        const outputFilePath = process.env.OUTPUT_FILE_PATH

        const s3Config = getS3Config()

        if (s3Config.credentials.accessKeyId && s3Config.credentials.secretAccessKey) {
          logger.info(
            { outputFilePath },
            'S3 credentials provided, saving to S3 at {outputFilePath}'
          )
          const s3Client = new S3Client(s3Config)

          const params: PutObjectCommandInput = {
            Bucket: 'github-action-speckle-preview-service-acceptance-test',
            Key: outputFilePath,
            Body: previewData.data,
            ACL: 'public-read',
            Metadata: {
              // Defines metadata tags.
              // 'x-amz-meta-my-key': 'your-value'
            }
          }

          const uploadObject = async () => {
            try {
              const data = await s3Client.send(new PutObjectCommand(params))
              logger.info(
                'Successfully uploaded object: ' + params.Bucket + '/' + params.Key
              )
              return data
            } catch (err) {
              logger.error(err, 'Failed to upload object')
            }
          }

          await uploadObject()
        } else {
          logger.info(
            { outputFilePath },
            'No S3 credentials provided, saving to local file system at {outputFilePath}'
          )
          await fs.writeFile(outputFilePath, previewData.data)
        }
      }
    )
  })
})
