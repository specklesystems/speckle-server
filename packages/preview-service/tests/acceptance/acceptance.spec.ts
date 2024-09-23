import { acceptanceTest } from '#/helpers/testExtensions.js'
import { ObjectPreview, type ObjectPreviewRow } from '@/repositories/objectPreview.js'
import { Previews } from '@/repositories/previews.js'
import cryptoRandomString from 'crypto-random-string'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { promises as fs } from 'fs'
import { OBJECTS_TABLE_NAME } from '#/migrations/migrations.js'
import type { Angle } from '@/domain/domain.js'
import { testLogger as logger } from '@/observability/logging.js'
import { parse } from 'csv-parse'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import { createReadStream } from 'fs'
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
  describe.sequential('Trigger and wait for the preview-service', () => {
    beforeEach(() => {
      // const dbName = inject('dbName')
      logger.info('🤜 running acceptance test before-each')
    })
    afterEach(() => {
      logger.info('🤛 running acceptance test after-each')
    })

    // we use integration test and not e2e test because we don't need the server
    acceptanceTest(
      'loads data, waits for completion, extracts rendered image',
      {
        timeout: 300000 //5 minutes
      },
      async ({ context }) => {
        const { db } = context
        // load data
        const streamId = cryptoRandomString({ length: 10 })

        // Initialize the parser
        const parser = parse({
          delimiter: ','
        })
        const fileStream = createReadStream('tests/data/deltas.csv')
        const objectId = '19209772913efd1466ea217a1ed4cd84' //base object in tests/data/deltas.csv
        const objectRows: Record<string, unknown>[] = []

        const transformIntoObject = new Transform({
          transform(chunk, _encoding, cb) {
            if (!Array.isArray(chunk)) throw new Error('Invalid record')
            if (chunk.length !== 7) throw new Error('Invalid record length')
            const row = {
              id: <unknown>chunk[0],
              speckleType: <unknown>chunk[1],
              totalChildrenCount: <unknown>chunk[2],
              totalChildrenCountByDepth: <unknown>chunk[3],
              createdAt: <unknown>chunk[4],
              data: <unknown>JSON.parse(chunk[5] as string),
              streamId //NOTE we override the stream ID to ensure it's loaded into the test stream
            }
            cb(null, row)
          }
        })
        const cacheRowIntoArray = new Transform({
          transform(row, _encoding, cb) {
            if (!row) return
            if (typeof row !== 'object') return
            if (Array.isArray(row)) return
            if (Object.getOwnPropertySymbols(row).length > 0) return

            objectRows.push(<Record<string, unknown>>row)
            cb(null, row)
          }
        })

        try {
          await pipeline(fileStream, parser, transformIntoObject, cacheRowIntoArray)
        } catch (err) {
          expect(err, 'Error parsing CSV file.').toBeUndefined()
        }

        // "id","speckleType","totalChildrenCount","totalChildrenCountByDepth","createdAt","data","streamId"
        await db.batchInsert(OBJECTS_TABLE_NAME, objectRows)

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
