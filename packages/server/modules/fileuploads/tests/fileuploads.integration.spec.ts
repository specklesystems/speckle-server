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

describe('FileUploads @fileuploads', () => {
  let server: Server
  let app: Express

  const userOne = {
    name: 'User',
    email: 'user@gmail.com',
    password: 'jdsadjsadasfdsa'
  }

  const streamOne = {
    name: 'streamOne',
    description: 'stream',
    isPublic: true,
    ownerId: ''
  }

  let userOneId: string
  let userOneToken: string
  let createdStreamId: string

  before(async () => {
    ;({ app, server } = await beforeEachContext())
    await initializeTestServer(server, app)

    userOneId = await createUser(userOne)
    streamOne.ownerId = userOneId
    createdStreamId = await createStream(streamOne)
    ;({ token: userOneToken } = await createToken({
      userId: userOneId,
      name: 'test token',
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read],
      lifespan: 3600
    }))
  })

  after(async () => {
    await server.close()
  })

  describe('Upload files', () => {
    it('Should upload a file', async () => {
      const result = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .attach('test.ifc', require.resolve('@/readme.md'))
      expect(result.statusCode).to.eq(201)
    })
  })
})
