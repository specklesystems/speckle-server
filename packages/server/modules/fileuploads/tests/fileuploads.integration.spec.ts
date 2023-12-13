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
import { BlobUploadResult } from '..'
import { AddressInfo } from 'net'

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
    }
    process.env['CANONICAL_URL'] = `http://127.0.0.1:${port}`

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
    it('Should upload a file', async () => {
      const response = await request(app)
        .post(`/api/file/autodetect/${createdStreamId}/main`)
        .set('Authorization', `Bearer ${userOneToken}`)
        .set('Accept', 'application/json')
        .attach('test.ifc', require.resolve('@/readme.md'), 'test.ifc')
      expect(response.statusCode).to.equal(201)
      expect(response.body.uploadResults).to.exist
      const uploadResults = response.body.uploadResults
      expect(uploadResults).to.have.lengthOf(1)
      expect(
        uploadResults.map((r: BlobUploadResult) => r.uploadStatus)
      ).to.have.members([1])
    })
  })

  it('Uploads from multipart upload', async () => {
    const response = await request(app)
      .post(`/api/file/autodetect/${createdStreamId}/main`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .attach('blob1', require.resolve('@/readme.md'))
      .attach('blob2', require.resolve('@/package.json'))
    expect(response.status).to.equal(201)
    expect(response.body.uploadResults).to.exist
    const uploadResults = response.body.uploadResults
    expect(uploadResults).to.have.lengthOf(2)
    expect(uploadResults.map((r: BlobUploadResult) => r.uploadStatus)).to.have.members([
      1, 1
    ])
  })

  it('Returns 400 for bad form data', async () => {
    const response = await request(app)
      .post(`/api/file/autodetect/${createdStreamId}/main`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .set('Content-type', 'multipart/form-data; boundary=XXX')
      // sending an unfinished part
      .send('--XXX\r\nCon')

    expect(response.status).to.equal(400)
  })

  it('Returns OK but describes errors for too big files', async () => {
    const response = await request(app)
      .post(`/api/file/autodetect/${createdStreamId}/main`)
      .set('Authorization', `Bearer ${userOneToken}`)
      .attach('toolarge.ifc', Buffer.alloc(114_857_601, 'asdf'), 'toolarge.ifc')
    expect(response.status).to.equal(201)

    expect(response.body.uploadResults).to.exist
    const uploadResults = response.body.uploadResults
    expect(uploadResults).to.have.lengthOf(1)
    expect(uploadResults.map((r: BlobUploadResult) => r.uploadStatus)).to.have.members([
      2
    ])
    expect(uploadResults.map((r: BlobUploadResult) => r.uploadError)).to.have.members([
      'File size limit reached'
    ])
  })
})
