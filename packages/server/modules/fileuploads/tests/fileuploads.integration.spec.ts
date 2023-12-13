/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'

import { createUser } from '@/modules/core/services/users'
import { createStream } from '@/modules/core/services/streams'
import { createToken } from '@/modules/core/services/tokens'
import type { Server } from 'http'
import type { Express } from 'express'
import request from 'supertest'
import { Scopes } from '@/modules/core/helpers/mainConstants'
import { AddressInfo } from 'net'
import { getStreamPendingModels } from '@/modules/fileuploads/repositories/fileUploads'
import cryptoRandomString from 'crypto-random-string'

describe('FileUploads @fileuploads', () => {
  let server: Server
  let app: Express

  const userOne = {
    name: 'User',
    email: 'user@gmail.com',
    password: 'jdsadjsadasfdsa'
  }

  let userOneId: string
  let userOneToken: string
  let createdStreamId: string
  let existingCanonicalUrl: string

  const isAddressInfo = (address: unknown): address is AddressInfo => {
    return (address as AddressInfo).port !== undefined
  }

  before(async () => {
    ;({ app, server } = await beforeEachContext())
    await initializeTestServer(server, app)

    //TODO does mocha have a nicer way of temporarily swapping an environment variable, like vitest?
    existingCanonicalUrl = process.env['CANONICAL_URL'] || ''
    const serverAddress = server.address()
    let port = 3000
    if (isAddressInfo(serverAddress)) {
      port = serverAddress.port
      process.env['CANONICAL_URL'] = `http://127.0.0.1:${port}`
    } else {
      process.env['CANONICAL_URL'] = serverAddress || `http://127.0.0.1:${port}`
    }

    userOneId = await createUser(userOne)
    createdStreamId = await createStream({ ownerId: userOneId })
    ;({ token: userOneToken } = await createToken({
      userId: userOneId,
      name: 'test token',
      scopes: [Scopes.Streams.Write],
      lifespan: 3600
    }))
  })

  after(async () => {
    process.env['CANONICAL_URL'] = existingCanonicalUrl
    await server.close()
  })

  describe('Uploads files', () => {
    it('Should upload a single file', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.statusCode).to.equal(201)
      expect(response.body).to.deep.equal({})

      expect(await getStreamPendingModels(createdStreamId)).to.have.lengthOf(1)
      //TODO expect subscription notification
    })

    it('Uploads from multipart upload', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('blob1', require.resolve('@/readme.md'))
        .attach('blob2', require.resolve('@/package.json'))
      expect(response.status).to.equal(201)
      expect(response.body).to.deep.equal({})
      expect(await getStreamPendingModels(createdStreamId)).to.have.lengthOf(2)
      //TODO expect subscription notification
    })

    it('Returns 400 for bad form data', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Content-type', 'multipart/form-data; boundary=XXX')
        // sending an unfinished part
        .send('--XXX\r\nCon')

      expect(response.status).to.equal(400)
      expect(await getStreamPendingModels(createdStreamId)).to.have.lengthOf(0)
      //TODO expect no subscription notifications
    })

    it('Returns OK but describes errors for too big files', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('toolarge.ifc', Buffer.alloc(114_857_601, 'asdf'), 'toolarge.ifc')
      expect(response.status).to.equal(201)

      expect(response.body).to.deep.equal({})
      expect(await getStreamPendingModels(createdStreamId)).to.have.lengthOf(0)
      //TODO expect no notifications
    })

    //TODO test for bad token
    it('Returns 403 for token without stream write permissions', async () => {
      const { token: badToken } = await createToken({
        userId: userOneId,
        name: 'test token',
        scopes: [Scopes.Streams.Read],
        lifespan: 3600
      })
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${badToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')
      expect(response.statusCode).to.equal(403)
      expect(await getStreamPendingModels(createdStreamId)).to.have.lengthOf(0)
      //TODO expect no notifications
    })

    it('Should not upload a file to a non-existent stream', async () => {
      const badStreamId = cryptoRandomString({ length: 10 })
      const response = await request(app)
        .post(`/api/file/autodetect/${badStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')
      expect(response.statusCode).to.equal(500) //FIXME should be 404 (technically a 401, but we don't want to leak existence of stream so 404 is preferrable)
      expect(await getStreamPendingModels(badStreamId)).to.have.lengthOf(0)
      //TODO expect no subscription notifications
    })

    it('Should not upload a file to a stream you do not have access to', async () => {
      const userTwo = {
        name: 'User Two',
        email: 'user2@example.org',
        password: 'jdsadjsadasfdsa'
      }
      const userTwoId = await createUser(userTwo)
      const streamTwoId = await createStream({ ownerId: userTwoId })

      const response = await request(app)
        .post(`/api/file/autodetect/${streamTwoId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')

      expect(response.statusCode).to.equal(403)
      expect(response.body).to.deep.equal({
        error: 'You do not have the required stream role'
      })

      expect(await getStreamPendingModels(streamTwoId)).to.have.lengthOf(0)
      //TODO expect no subscription notifications
    })
  })
})
