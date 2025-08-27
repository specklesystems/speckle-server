/* istanbul ignore file */
import { expect } from 'chai'
import request from 'supertest'

import assert from 'assert'
import crypto from 'crypto'

import { beforeEachContext } from '@/test/hooks'
import { createManyObjects } from '@/test/helpers'

import { Scopes, wait } from '@speckle/shared'
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
import { createTestUser, type BasicTestUser } from '@/test/authHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

describe('Upload/Download Routes @api-rest', () => {
  let userA: BasicTestUser
  let tokenUserA: string
  let userB: BasicTestUser
  let tokenUserB: string

  let testStream: BasicTestStream
  let privateTestStream: BasicTestStream

  let app: Express.Express
  before(async () => {
    ;({ app } = await beforeEachContext())

    userA = await createTestUser({
      name: 'd1',
      email: 'd.1@speckle.systems',
      password: 'wowwow8charsplease',
      id: ''
    })
    tokenUserA = `Bearer ${await createPersonalAccessToken(
      userA.id,
      'test token user A',
      [
        Scopes.Streams.Read,
        Scopes.Streams.Write,
        Scopes.Users.Read,
        Scopes.Users.Email,
        Scopes.Tokens.Write,
        Scopes.Tokens.Read,
        Scopes.Profile.Read,
        Scopes.Profile.Email
      ]
    )}`

    userB = await createTestUser({
      name: 'd2',
      email: 'd.2@speckle.systems',
      password: 'wowwow8charsplease',
      id: ''
    })
    tokenUserB = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
      [
        Scopes.Streams.Read,
        Scopes.Streams.Write,
        Scopes.Users.Read,
        Scopes.Users.Email,
        Scopes.Tokens.Write,
        Scopes.Tokens.Read,
        Scopes.Profile.Read,
        Scopes.Profile.Email
      ]
    )}`

    testStream = await createTestStream(
      {
        name: 'Test Stream 01',
        description: 'wonderful test stream'
      },
      userA
    )
    privateTestStream = await createTestStream(
      {
        name: 'Private Test Stream',
        isPublic: false
      },
      userA
    )
  })

  it('Should not allow download requests without an authorization token or valid streamId', async () => {
    // invalid token and streamId
    let res = await request(app)
      .get('/objects/wow_hack/null')
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // private stream snooping is forbidden
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/maybeSomethingIsHere`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // invalid token for public stream works
    res = await request(app)
      .get(`/objects/${testStream.id}/null`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // invalid streamId
    res = await request(app)
      .get(`/objects/${'thisDoesNotExist'}/null`)
      .set('Authorization', tokenUserA)
    expect(res).to.have.status(404)

    // create some objects
    const objBatches = [createManyObjects(20), createManyObjects(20)]

    await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objBatches[0]), 'utf8'))
      .attach('batch2', Buffer.from(JSON.stringify(objBatches[1]), 'utf8'))

    // should allow invalid tokens (treat them the same as no tokens?)
    // no, we're treating invalid tokens as invalid tokens
    res = await request(app)
      .get(`/objects/${testStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // should not allow invalid tokens on private streams
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // should not allow user b to access user a's private stream
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', tokenUserB)
    expect(res).to.have.status(401)
  })

  it('should not allow a non-multipart/form-data request without a boundary', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .send(Buffer.from(JSON.stringify(objBatches[0]), 'utf8')) //sent, not attached, so no boundary will be added to Content-type header.
    expect(res).to.have.status(400)
    expect(res.text).to.equal(
      'Failed to parse request headers and body content as valid multipart/form-data.'
    )
  })

  it('should not allow a non-multipart/form-data request, even if it has a valid header', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'application/json')
      .attach(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Buffer.from(JSON.stringify(objBatches[0]), 'utf8') as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        undefined as any
      )
    expect(res).to.have.status(400)
    expect(res.text).to.equal(
      'Failed to parse request headers and body content as valid multipart/form-data.'
    )
  })

  it('should not allow non-buffered requests', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attach(JSON.stringify(objBatches[0]) as any, undefined as any)
    expect(res).to.have.status(400)
    expect(res.text).to.equal(
      'Failed to parse request headers and body content as valid multipart/form-data.'
    )
  })

  it('Should not allow getting an object that is not part of the stream', async () => {
    const objBatch = createManyObjects(20)

    await request(app)
      .post(`/objects/${privateTestStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objBatch), 'utf8'))

    // should allow userA to access privateTestStream object
    let res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatch[0].id}`)
      .set('Authorization', tokenUserA)
    expect(res).to.have.status(200)

    // should not allow userB to access privateTestStream object by pretending it's in public stream
    res = await request(app)
      .get(`/objects/${testStream.id}/${objBatch[0].id}`)
      .set('Authorization', tokenUserB)
    expect(res).to.have.status(404)
  })

  it('Should not allow upload requests without an authorization token or valid streamId', async () => {
    // invalid token and streamId
    let res = await request(app)
      .post('/objects/wow_hack')
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // invalid token
    res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // invalid streamId
    res = await request(app)
      .post(`/objects/${'thisDoesNotExist'}`)
      .set('Authorization', tokenUserA)
    expect(res).to.have.status(401)
  })

  it('Should not allow upload with invalid body (not contained within array)', async () => {
    //creating a single valid object
    const objectToPost = {
      name: 'yet again cannot believe i have to create this',
      id: ''
    }
    const objectId = crypto
      .createHash('md5')
      .update(JSON.stringify(objectToPost))
      .digest('hex')
    objectToPost.id = objectId

    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objectToPost), 'utf8'))

    expect(res).to.have.status(400)
  })

  it('Should not allow upload with invalid body (invalid json)', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify('this is not json'), 'utf8'))

    expect(res).to.have.status(400)
  })

  // it('Should not allow upload with invalid body (object too large)', async () => {
  //   //creating a single valid object larger than 10MB
  //   const objectToPost = {
  //     name: 'x'.repeat(10 * 1024 * 1024 + 1)
  //   }

  //   const res = await request(app)
  //     .post(`/objects/${testStream.id}`)
  //     .set('Authorization', tokenUserA)
  //     .set('Content-type', 'multipart/form-data')
  //     .attach('batch1', Buffer.from(JSON.stringify([objectToPost]), 'utf8'))

  //   expect(res).to.have.status(400)
  //   expect(res.text).contains('Object too large')
  // })

  let parentId: string
  const numObjs = 5000
  const objBatches = [
    createManyObjects(numObjs),
    createManyObjects(numObjs),
    createManyObjects(numObjs)
  ]

  it('Should properly upload a bunch of objects', async () => {
    parentId = objBatches[0][0].id

    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objBatches[0]), 'utf8'))
      .attach('batch2', Buffer.from(JSON.stringify(objBatches[1]), 'utf8'))
      .attach('batch3', Buffer.from(JSON.stringify(objBatches[2]), 'utf8'))

    // TODO: test gzipped uploads. They work. Current blocker: cannot set content-type for each part in the 'multipart' request.
    // .attach( 'batch1', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 0 ] ) ), 'utf8' ) )
    // .attach( 'batch2', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 1 ] ) ), 'utf8' ) )
    // .attach( 'batch3', zlib.gzipSync( Buffer.from( JSON.stringify( objBatches[ 2 ] ) ), 'utf8' ) )

    expect(res).to.have.status(201)
  })

  it('Should properly download an object, with all its children, into a application/json response', async () => {
    await wait(1500) // avoids race condition

    await new Promise<void>((resolve, reject) => {
      void request(app)
        .get(`/objects/${testStream.id}/${parentId}`)
        .set('Authorization', tokenUserA)
        .buffer()
        .parse((res, cb) => {
          const resTyped = res as typeof res & { data: string }
          resTyped.data = ''
          resTyped.on('data', (chunk) => {
            resTyped.data += chunk.toString()
          })
          resTyped.on('end', () => {
            cb(null, resTyped.data)
          })
        })
        .end((err, res) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          if (err) return reject(err)
          try {
            const o = JSON.parse(res.body)
            expect(o.length).to.equal(numObjs + 1)
            expect(res).to.be.json
            return resolve()
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err)
          }
        })
    })
  })

  it('Should properly download an object, with all its children, into a text/plain response', async () => {
    await new Promise<void>((resolve, reject) => {
      void request(app)
        .get(`/objects/${testStream.id}/${parentId}`)
        .set('Authorization', tokenUserA)
        .set('Accept', 'text/plain')
        .buffer()
        .parse((res, cb) => {
          const resTyped = res as typeof res & { data: string }

          resTyped.data = ''
          resTyped.on('data', (chunk) => {
            resTyped.data += chunk.toString()
          })
          resTyped.on('end', () => {
            cb(null, resTyped.data)
          })
        })
        .end((err, res) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          if (err) return reject(err)
          try {
            const o = res.body.split('\n').filter((l: string) => l !== '')
            expect(o.length).to.equal(numObjs + 1)
            expect(res).to.be.text
            return resolve()
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err)
          }
        })
    })
  })

  it('Should properly download a list of objects', async () => {
    const objectIds: string[] = []
    for (let i = 0; i < objBatches[0].length; i++) {
      objectIds.push(objBatches[0][i].id)
    }

    await new Promise<void>((resolve, reject) => {
      void request(app)
        .post(`/api/getobjects/${testStream.id}`)
        .set('Authorization', tokenUserA)
        .set('Accept', 'text/plain')
        .send({ objects: JSON.stringify(objectIds) })
        .buffer()
        .parse((res, cb) => {
          const resTyped = res as typeof res & { data: string }

          resTyped.data = ''
          resTyped.on('data', (chunk) => {
            resTyped.data += chunk.toString()
          })
          resTyped.on('end', () => {
            cb(null, resTyped.data)
          })
        })
        .end((err, res) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          if (err) return reject(err)
          try {
            const o = res.body.split('\n').filter((l: string) => l !== '')
            expect(o.length).to.equal(objectIds.length)
            expect(res).to.be.text
            return resolve()
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err)
          }
        })
    })
  })

  it('Should return nothing if the object is not found', async () => {
    const objectIds = []
    objectIds.push(cryptoRandomString({ length: 10 })) // random string that does not exist

    const res = await request(app)
      .post(`/api/getobjects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .set('Accept', 'text/plain')
      .send({ objects: JSON.stringify(objectIds) })
      .buffer()
    expect(res).to.have.status(200)
    expect(res.text).to.equal('') // empty response, as the object is not found
  })

  it('Should return status code 400 when getting the list of objects and if it is not parseable', async () => {
    const response = await request(app)
      .post(`/api/getobjects/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .send({ objects: ['lolz', 'thisIsBroken', 'shouldHaveBeenJSONStringified'] })

    expect(response).to.have.status(400)
  })

  it('Should properly check if the server has a list of objects', async () => {
    const objectIds: string[] = []
    for (let i = 0; i < objBatches[0].length; i++) {
      objectIds.push(objBatches[0][i].id)
    }
    const fakeIds: string[] = []
    for (let i = 0; i < 100; i++) {
      const fakeId = crypto
        .createHash('md5')
        .update('fakefake' + i)
        .digest('hex')
      fakeIds.push(fakeId)
      objectIds.push(fakeId)
    }

    await new Promise<void>((resolve, reject) => {
      void request(app)
        .post(`/api/diff/${testStream.id}`)
        .set('Authorization', tokenUserA)
        .send({ objects: JSON.stringify(objectIds) })
        .buffer()
        .parse((res, cb) => {
          const resTyped = res as typeof res & { data: string }

          resTyped.data = ''
          resTyped.on('data', (chunk) => {
            resTyped.data += chunk.toString()
          })
          resTyped.on('end', () => {
            cb(null, resTyped.data)
          })
        })
        .end((err, res) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          if (err) return reject(err)
          try {
            const o = JSON.parse(res.body)
            expect(Object.keys(o).length).to.equal(objectIds.length)
            // console.log(JSON.stringify(Object.keys(o), undefined, 4))
            for (let i = 0; i < objBatches[0].length; i++) {
              assert(
                o[objBatches[0][i].id] === true,
                `Server is missing an object: ${objBatches[0][i].id}`
              )
            }
            for (let i = 0; i < fakeIds.length; i++) {
              assert(
                o[fakeIds[i]] === false,
                'Server wrongly reports it has an extra object'
              )
            }
            return resolve()
          } catch (err) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(err)
          }
        })
    })
  })

  it('Should return status code 400 if the list of objects is not parseable', async () => {
    const response = await request(app)
      .post(`/api/diff/${testStream.id}`)
      .set('Authorization', tokenUserA)
      .send({ objects: ['lolz', 'thisIsBroken', 'shouldHaveBeenJSONStringified'] })

    expect(response).to.have.status(400)
  })
})

describe('Express @core-rest', () => {
  let app: Express.Express
  before(async () => {
    ;({ app } = await beforeEachContext())
  })
  it('Should return 400 for broken JSON', async () => {
    const res = await request(app).post('/graphql').send('{b0rken json}')
    expect(res).to.have.status(400)
  })
})
