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
import cryptoRandomString from 'crypto-random-string'
import type { Express } from 'express'
import type { Server } from 'http'
import request from 'supertest'
import { initUploadTestEnvironment } from '@/modules/fileuploads/tests/helpers/init'
import { BranchRecord } from '@/modules/core/helpers/types'

const { createUser, createStream, createToken, createBranch } =
  initUploadTestEnvironment()

const fileImporterUrl = (projectOneId: string, modelId: string) =>
  `/api/projects/${projectOneId}/models/${modelId}/fileimporter/jobs`

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
    let projectTwoId: string
    let modelOne: BranchRecord
    let modelTwo: BranchRecord

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

      projectTwoId = await createStream({ ownerId: userOneId })
      ;({ token: userOneToken } = await createToken({
        userId: userOneId,
        name: createRandomString(),
        scopes: [Scopes.Streams.Write]
      }))

      modelOne = await createBranch({
        name: createRandomString(),
        description: createRandomString(),
        streamId: projectOneId,
        authorId: userOneId
      })

      modelTwo = await createBranch({
        name: createRandomString(),
        description: createRandomString(),
        streamId: projectTwoId,
        authorId: userOneId
      })
    })

    afterEach(async () => {
      userOneId = ''
      projectOneId = ''
      projectTwoId = ''
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
                    branchName
                  }
                }
              }`,
        variables: { streamId: projectId }
      })

    it('should 403 if no auth token is provided', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Content-type', 'multipart/form-data')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.status).to.equal(403)
    })

    it('should 403 if an invalid auth token is provided', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${cryptoRandomString({ length: 20 })}`)
        .set('Content-type', 'multipart/form-data')
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
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${badToken.token}`)
        .set('Content-type', 'multipart/form-data')
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
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${userTwoToken.token}`)
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.status).to.equal(403)
    })

    it('should 400 if file is not sent', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data')
      // .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc') // on purpose

      expect(response.status).to.equal(400)
    })

    it('should 401 if the model cannot be found', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, createRandomString()))
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.status).to.equal(401)
    })

    it('should 401 if the model exist but not in the queried project', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelTwo.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.status).to.equal(401)
    })

    it('sucessfuly uploads a file with 201', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.status).to.equal(201)
      const gqlResponse = await getFileUploads(projectOneId, userOneToken)
      expect(noErrors(gqlResponse))
      expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
      const uploadedFile = gqlResponse.body.data.stream.fileUploads[0]
      expect(uploadedFile.convertedStatus).to.equal(FileUploadConvertedStatus.Queued)
      expect(uploadedFile.fileName).to.equal('test.ifc')
      expect(uploadedFile.branchName).to.eq(modelOne.name)
    })

    it('supports multiple attachments', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test1.ifc', require.resolve('@/readme.md'), 'test1.ifc')
        .attach('test2.ifc', require.resolve('@/package.json'), 'test2.ifc')

      expect(response.status).to.equal(201)
      const gqlResponse = await getFileUploads(projectOneId, userOneToken)
      expect(noErrors(gqlResponse))
      expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(2)
      expect(gqlResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
        FileUploadConvertedStatus.Queued
      )
      expect(gqlResponse.body.data.stream.fileUploads[1].convertedStatus).to.equal(
        FileUploadConvertedStatus.Queued
      )
    })

    it('says OK with errors for too big files', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('toolarge.ifc', Buffer.alloc(114_857_601, 'asdf'), 'toolarge.ifc')

      expect(response.status).to.equal(201)
      const gqlResponse = await getFileUploads(projectOneId, userOneToken)
      expect(noErrors(gqlResponse))
      expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
      expect(gqlResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
        FileUploadConvertedStatus.Queued
      )
    })

    it('says OK to empty files', async () => {
      const response = await request(app)
        .post(fileImporterUrl(projectOneId, modelOne.id))
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('empty.ifc', Buffer.alloc(0), 'empty.ifc')

      expect(response.status).to.equal(201)
      const gqlResponse = await getFileUploads(projectOneId, userOneToken)
      expect(noErrors(gqlResponse))
      expect(gqlResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
      expect(gqlResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
        FileUploadConvertedStatus.Queued
      )
    })
  }
)
