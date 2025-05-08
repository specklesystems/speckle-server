/* istanbul ignore file */
import { Scopes } from '@/modules/core/helpers/mainConstants'
import {
  createRandomEmail,
  createRandomPassword,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { noErrors } from '@/test/helpers'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { expect } from 'chai'
import { randomInt } from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import type { Express } from 'express'
import type { Server } from 'http'
import request from 'supertest'
import { initUploadTestEnvironment } from '@/modules/fileuploads/tests/helpers/init'
import { BranchRecord } from '@/modules/core/helpers/types'

const { createUser, createStream, createToken, createBranch } =
  initUploadTestEnvironment()

const fileImporterUrl = (projectOneId: string, modelId?: string) =>
  `/api/projects/${projectOneId}/fileimporter/jobs` +
  (modelId ? `?modelId=${modelId}` : ``)

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = getFeatureFlags()

;(FF_NEXT_GEN_FILE_IMPORTER_ENABLED ? describe : describe.skip)(
  'File importer @fileuploads integration',
  () => {
    let server: Server
    let app: Express
    let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

    let userOneId: string
    let userOneToken: string
    let projectOneId: string
    let model: BranchRecord

    let existingCanonicalUrl: string
    let existingPort: string
    let serverAddress: string
    let serverPort: string

    before(async () => {
      const ctx = await beforeEachContext()
      server = ctx.server
      app = ctx.app
      ;({ serverAddress, serverPort, sendRequest } = await initializeTestServer(ctx))

      //TODO does mocha have a nicer way of temporarily swapping an environment variable, like vitest?
      existingCanonicalUrl = process.env['CANONICAL_URL'] || ''
      existingPort = process.env['PORT'] || ''
      process.env['CANONICAL_URL'] = serverAddress
      process.env['PORT'] = serverPort
    })

    beforeEach(async () => {
      userOneId = await createUser({
        name: createRandomString(),
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      projectOneId = await createStream({ ownerId: userOneId })
      ;({ token: userOneToken } = await createToken({
        userId: userOneId,
        name: createRandomString(),
        scopes: [Scopes.Streams.Write]
      }))

      model = await createBranch({
        name: createRandomString(),
        description: createRandomString(),
        streamId: projectOneId,
        authorId: userOneId
      })
    })

    afterEach(async () => {
      projectOneId = ''
    })

    after(async () => {
      process.env['CANONICAL_URL'] = existingCanonicalUrl
      process.env['PORT'] = existingPort
      await server?.close()
    })

    const getFileUploads = (projectId: string, token: string) =>
      sendRequest(token, {
        query: `query ($streamId: String!) {
                stream(id: $streamId) {
                  id
                  fileUploads {
                    id
                    fileName
                    convertedStatus
                  }
                }
              }`,
        variables: { streamId: projectId }
      })

    describe('Receive results from file import service', async () => {
      it('should 403 if no auth token is provided', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Content-Type', 'application/json')
          .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

        expect(response.status).to.equal(403)
      })

      it('should 403 if an invalid auth token is provided', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${cryptoRandomString({ length: 20 })}`)
          .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

        expect(response.status).to.equal(403)
      })

      it('should 403 if the token does not have the correct scopes', async () => {
        const badToken = await createToken({
          userId: userOneId,
          name: createRandomString(),
          scopes: [Scopes.Streams.Read]
        })
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${badToken.token}`)
          .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

        expect(response.status).to.equal(403)
      })

      it('should 403 if the token is for a different user', async () => {
        const userTwoId = await createUser({
          name: createRandomString(),
          email: createRandomEmail(),
          password: createRandomPassword()
        })
        const userTwoToken = await createToken({
          userId: userTwoId,
          name: createRandomString(),
          scopes: [Scopes.Streams.Read]
        })
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${userTwoToken.token}`)
          .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

        expect(response.status).to.equal(403)
      })

      it('should 400 if file is not sent', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${userOneToken}`)
          .send(JSON.stringify({}))

        expect(response.status).to.equal(400)
      })

      it('should 404 if the model cannot be found', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, createRandomString()))
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${userOneToken}`)
          .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

        expect(response.status).to.equal(404)
      })

      it('should 200 if the payload reports a success result', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Authorization', `Bearer ${userOneToken}`)
          .set('Content-Type', 'application/json')
          .send(
            JSON.stringify({
              status: 'success',
              warnings: [],
              result: {
                versionId: cryptoRandomString({ length: 10 }),
                durationSeconds: randomInt(1, 3600)
              }
            })
          )

        expect(response.status).to.equal(200)
        const gqlResponse = await getFileUploads(projectOneId, userOneToken)
        expect(noErrors(gqlResponse))
        expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
        expect(gqlResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
          FileUploadConvertedStatus.Completed
        )
      })

      it('should 200 if the payload reports an error result', async () => {
        const response = await request(app)
          .post(fileImporterUrl(projectOneId, model.id))
          .set('Authorization', `Bearer ${userOneToken}`)
          .set('Content-Type', 'application/json')
          .send(
            JSON.stringify({
              status: 'error',
              reasons: [cryptoRandomString({ length: 10 })],
              result: {
                durationSeconds: randomInt(1, 3600)
              }
            })
          )

        expect(response.status).to.equal(200)
        const gqlResponse = await getFileUploads(projectOneId, userOneToken)
        expect(noErrors(gqlResponse))
        expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
        expect(gqlResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
          FileUploadConvertedStatus.Error
        )
      })

      // TODO: multipart
      // TODO: too big
    })
  }
)
