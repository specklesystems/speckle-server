/* istanbul ignore file */
import { expect } from 'chai'
import request from 'supertest'
import { beforeEachContext } from '@/test/hooks'
import { Scopes } from '@speckle/shared'
import { db } from '@/db/knex'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeTokenScopesFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory
} from '@/modules/core/repositories/tokens'
import cryptoRandomString from 'crypto-random-string'
import type Express from 'express'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
// import { storeObjectPreviewFactory } from '@/modules/previews/repository/previews'
// import { PreviewPriority } from '@/modules/previews/domain/consts'

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

// const storePreview = storeObjectPreviewFactory({ db })

describe('Previews REST API @previews', () => {
  const userA: BasicTestUser = {
    name: cryptoRandomString({ length: 5 }),
    email: createRandomEmail(),
    password: cryptoRandomString({ length: 16 }),
    id: ''
  }
  let userAToken: string
  const userB: BasicTestUser = {
    name: cryptoRandomString({ length: 5 }),
    email: createRandomEmail(),
    password: cryptoRandomString({ length: 16 }),
    id: ''
  }
  let userBToken: string

  const testStream = {
    name: cryptoRandomString({ length: 5 }),
    description: 'A test stream',
    id: '',
    ownerId: ''
  }

  let app: Express.Express
  before(async () => {
    ;({ app } = await beforeEachContext())

    await createTestUsers([userA, userB])

    userAToken = `Bearer ${await createPersonalAccessToken(
      userA.id,
      'test token user A',
      [Scopes.Streams.Read, Scopes.Automate.ReportResults]
    )}`

    userBToken = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
      [Scopes.Streams.Read, Scopes.Automate.ReportResults]
    )}`

    await createTestStream(testStream, userA)
  })

  describe('POST /api/projects/:streamId/previews/jobs/:jobId/results', () => {
    let objectId: string
    let jobId: string
    const validObjectToPost = {
      status: 'success',
      jobId: '',
      result: { screenshots: {}, durationSeconds: 1 }
    }
    beforeEach(async () => {
      objectId = cryptoRandomString({ length: 10 })
      jobId = `${testStream.id}.${objectId}`
      validObjectToPost.jobId = jobId
    })

    it('responds with a 403 for an invalid token', async () => {
      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', cryptoRandomString({ length: 10 }))
        .send(JSON.stringify(validObjectToPost))
      expect(res, JSON.stringify(res)).to.have.status(403)
    })

    it('responds with a 403 if the Authorization header is empty', async () => {
      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', '')
        .send(JSON.stringify(validObjectToPost))
      expect(res, JSON.stringify(res)).to.have.status(403)
    })

    it('Should 403 if the token does not have the required scopes', async () => {
      const badToken = `Bearer ${await createPersonalAccessToken(
        userA.id,
        'test token user A with insufficient scopes',
        [Scopes.Streams.Read] // missing Automate.ReportResults scope
      )}`

      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', badToken)
        .send(JSON.stringify(validObjectToPost))

      expect(res, JSON.stringify(res)).to.have.status(403)
    })

    it('responds with a 404 for an invalid streamId', async () => {
      const res = await request(app)
        .post(`/api/projects/thisdoesnotexist/previews/jobs/${jobId}/results`)
        .set('Authorization', userAToken)
        .send(JSON.stringify(validObjectToPost))
      expect(res, JSON.stringify(res)).to.have.status(404)
    })

    it('responds with a 404 for an attempt to access a project the user does not have access to', async () => {
      // should not allow user b to access user a's private stream
      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', userBToken)
        .send(JSON.stringify(validObjectToPost))
      expect(res, JSON.stringify(res)).to.have.status(401)
    })

    it('Should not allow upload with invalid body', async () => {
      const invalidObjectToPost = {
        name: 'I iz brokenz',
        id: ''
      }

      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', userAToken)
        .set('Content-type', 'application/json')
        .send(JSON.stringify(invalidObjectToPost))

      expect(res, JSON.stringify(res)).to.have.status(400)
    })

    it('Should not allow upload with invalid body (invalid json)', async () => {
      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', userAToken)
        .set('Content-type', 'application/json')
        .send(JSON.stringify('this is not json'))

      expect(res, JSON.stringify(res)).to.have.status(400)
    })

    it('Should allow upload with valid body, even if the job does not exist', async () => {
      const res = await request(app)
        .post(`/api/projects/${testStream.id}/previews/jobs/${jobId}/results`)
        .set('Authorization', userAToken)
        .set('Content-type', 'application/json')
        .send(JSON.stringify(validObjectToPost))

      expect(res, JSON.stringify(res)).to.have.status(200)
    })
  })
})
