import { acceptanceTest } from '#/helpers/testExtensions.js'
import { ObjectPreview, type ObjectPreviewRow } from '@/repositories/objectPreview.js'
import { Previews } from '@/repositories/previews.js'
import cryptoRandomString from 'crypto-random-string'
import { afterEach, beforeEach, describe, expect, inject } from 'vitest'
import { promises as fs } from 'fs'
import { spawn } from 'child_process'
import { OBJECTS_TABLE_NAME } from '#/migrations/migrations.js'
import type { Angle } from '@/domain/domain.js'

describe.sequential('Acceptance', () => {
  describe.sequential('Run the preview-service image in docker', () => {
    beforeEach(() => {
      const dbName = inject('dbName')
      const pgConnString =
        process.env.PG_CONNECTION_STRING ||
        `postgres://preview_service_test:preview_service_test@host.docker.internal:5432/${dbName}`
      //purposefully running in the background without waiting
      void runProcess('docker', [
        'run',
        '--env',
        `PG_CONNECTION_STRING=${pgConnString}`,
        '--rm',
        '--name',
        'preview-service',
        'speckle/preview-service:local'
      ])
    })
    afterEach(async () => {
      await runProcess('docker', ['stop', 'preview-service'])
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

          // wait a second before polling again
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        const previewData = await Previews({ db })
          .select(['data'])
          .where('id', objectPreviewResult[0].preview['all' as Angle])
          .first()

        if (!previewData) {
          expect(previewData).toBeDefined()
          expect(previewData).not.toBeNull()
          return //HACK to appease typescript
        }

        //TODO use environment variable
        const outputFilePath =
          process.env.OUTPUT_FILE_PATH || '/tmp/preview-service-output.png'
        await fs.writeFile(outputFilePath, previewData.data)
      }
    )
  })
})

function runProcess(cmd: string, cmdArgs: string[], extraEnv?: Record<string, string>) {
  return new Promise((resolve, reject) => {
    const childProc = spawn(cmd, cmdArgs, { env: { ...process.env, ...extraEnv } })
    childProc.stdout.pipe(process.stdout)
    childProc.stderr.pipe(process.stderr)

    childProc.on('close', (code) => {
      if (code === 0) {
        resolve('success')
      } else {
        reject(`Parser exited with code ${code}`)
      }
    })
  })
}
