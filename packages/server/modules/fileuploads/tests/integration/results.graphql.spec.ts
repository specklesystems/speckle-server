/* istanbul ignore file */
import { Scopes } from '@/modules/core/helpers/mainConstants'
import {
  createRandomEmail,
  createRandomPassword,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { haveErrors, noErrors } from '@/test/helpers'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { expect } from 'chai'
import { randomInt } from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import type { Server } from 'http'
import { initUploadTestEnvironment } from '@/modules/fileuploads/tests/helpers/init'
import { createFileUploadJob } from '@/modules/fileuploads/tests/helpers/creation'

const { createUser, createStream, createToken } = initUploadTestEnvironment()

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = getFeatureFlags()

;(FF_NEXT_GEN_FILE_IMPORTER_ENABLED ? describe : describe.skip)(
  'File import results @fileuploads integration',
  () => {
    let server: Server
    let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

    const userOne = {
      name: createRandomString(),
      email: createRandomEmail(),
      password: createRandomPassword()
    }

    let userOneId: string
    let userOneToken: string
    let projectOneId: string
    let jobOneId: string
    let existingCanonicalUrl: string
    let existingPort: string
    let serverAddress: string
    let serverPort: string

    before(async () => {
      const ctx = await beforeEachContext()
      server = ctx.server
      ;({ serverAddress, serverPort, sendRequest } = await initializeTestServer(ctx))

      //TODO does mocha have a nicer way of temporarily swapping an environment variable, like vitest?
      existingCanonicalUrl = process.env['CANONICAL_URL'] || ''
      existingPort = process.env['PORT'] || ''
      process.env['CANONICAL_URL'] = serverAddress
      process.env['PORT'] = serverPort

      userOneId = await createUser(userOne)
    })

    beforeEach(async () => {
      projectOneId = await createStream({ ownerId: userOneId })
      ;({ token: userOneToken } = await createToken({
        userId: userOneId,
        name: createRandomString(),
        scopes: [Scopes.Streams.Write]
      }))

      //FIXME currently assuming a 1:1 file to job mapping
      ;({ id: jobOneId } = await createFileUploadJob({
        projectId: projectOneId,
        userId: userOneId
      }))
    })

    afterEach(async () => {
      projectOneId = ''
    })

    after(async () => {
      process.env['CANONICAL_URL'] = existingCanonicalUrl
      process.env['PORT'] = existingPort
      await server?.close()
    })

    const finishFileUpload = (
      token: string,
      payload:
        | {
            status: string
            jobId: string
            projectId: string
            warnings?: string[]
            result: {
              versionId?: string
              durationSeconds: number
              downloadDurationSeconds: number
              parseDurationSeconds: number
              parser: string
            }
          }
        | { wrongContent: string }
    ) =>
      sendRequest(token, {
        query: `mutation ($input: FinishFileImportInput!) {
            fileUploadMutations {
            finishFileImport(input: $input)
          }
        }`,
        variables: {
          input: payload
        }
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
        const sucessPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload('', sucessPayload)

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.body).to.nested.include({
          'errors[0].extensions.code': 'FORBIDDEN',
          'errors[0].extensions.statusCode': 403
        })
      })

      it('should 403 if an invalid auth token is provided', async () => {
        const badToken = cryptoRandomString({ length: 32 })
        const sucessPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(badToken, sucessPayload)

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.body).to.nested.include({
          error: 'Your token is not valid.'
        })
      })

      it('should 403 if the token does not have the correct scopes', async () => {
        const { token: readOnlyToken } = await createToken({
          userId: userOneId,
          name: createRandomString(),
          scopes: [Scopes.Streams.Read]
        })
        const sucessPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(readOnlyToken, sucessPayload)

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.body).to.nested.include({
          'errors[0].extensions.code': 'FORBIDDEN',
          'errors[0].extensions.statusCode': 403
        })
      })

      it('should 403 if the token is for a different user', async () => {
        const userTwoId = await createUser({
          name: createRandomString(),
          email: createRandomEmail(),
          password: createRandomPassword()
        })
        const { token: userTwoToken } = await createToken({
          userId: userTwoId,
          name: createRandomString(),
          scopes: [Scopes.Streams.Read]
        })
        const sucessPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(userTwoToken, sucessPayload)

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.body).to.nested.include({
          'errors[0].extensions.code': 'FORBIDDEN',
          'errors[0].extensions.statusCode': 403
        })
      })

      it('should 400 if the payload is invalid', async () => {
        const gqlResponse = await finishFileUpload(userOneToken, {
          wrongContent: 'bad mutation'
        })

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.status).to.eq(400)
      })

      it('should 404 if the job id cannot be found', async () => {
        const sucessPayload = {
          projectId: projectOneId,
          jobId: cryptoRandomString({ length: 10 }),
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(userOneToken, sucessPayload)

        expect(haveErrors(gqlResponse))
        expect(gqlResponse.body).to.nested.include({
          'errors[0].extensions.code': 'FILE_IMPORT_JOB_NOT_FOUND',
          'errors[0].extensions.statusCode': 404
        })
      })

      it('should 200 if the payload reports a success result', async () => {
        const sucessPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'success',
          result: {
            versionId: cryptoRandomString({ length: 10 }),
            durationSeconds: randomInt(1, 3600),
            downloadDurationSeconds: randomInt(1, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(userOneToken, sucessPayload)
        expect(noErrors(gqlResponse))
        expect(gqlResponse.status).to.equal(200)

        const fileResponse = await getFileUploads(projectOneId, userOneToken)
        expect(noErrors(fileResponse))
        expect(fileResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
        expect(fileResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
          FileUploadConvertedStatus.Completed
        )
      })

      it('should 200 if the payload reports an error result', async () => {
        const errorPayload = {
          projectId: projectOneId,
          jobId: jobOneId,
          status: 'error',
          reason: cryptoRandomString({ length: 10 }),
          result: {
            durationSeconds: randomInt(0, 3600),
            downloadDurationSeconds: randomInt(0, 3600),
            parseDurationSeconds: randomInt(1, 3600),
            parser: 'ifc'
          }
        }

        const gqlResponse = await finishFileUpload(userOneToken, errorPayload)
        expect(noErrors(gqlResponse))
        expect(gqlResponse.status).to.equal(200)

        const fileResponse = await getFileUploads(projectOneId, userOneToken)
        expect(noErrors(fileResponse))
        expect(fileResponse.body.data.stream.fileUploads).to.have.lengthOf(1)
        expect(fileResponse.body.data.stream.fileUploads[0].convertedStatus).to.equal(
          FileUploadConvertedStatus.Error
        )
      })
    })
  }
)
