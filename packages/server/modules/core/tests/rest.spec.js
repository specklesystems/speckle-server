/* istanbul ignore file */
const expect = require('chai').expect
const request = require('supertest')

const assert = require('assert')
const crypto = require('crypto')

const { beforeEachContext } = require('@/test/hooks')
const { createManyObjects } = require('@/test/helpers')

const { createUser } = require('../services/users')
const { createPersonalAccessToken } = require('../services/tokens')
const { createStream } = require('../services/streams')

describe('Upload/Download Routes @api-rest', () => {
  const userA = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    password: 'wowwow8charsplease'
  }
  const userB = {
    name: 'd2',
    email: 'd.2@speckle.systems',
    password: 'wowwow8charsplease'
  }

  const testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream'
  }

  const privateTestStream = { name: 'Private Test Stream', isPublic: false }

  let app
  before(async () => {
    ;({ app } = await beforeEachContext())

    userA.id = await createUser(userA)
    userA.token = `Bearer ${await createPersonalAccessToken(
      userA.id,
      'test token user A',
      [
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`

    userB.id = await createUser(userB)
    userB.token = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
      [
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`

    testStream.id = await createStream({ ...testStream, ownerId: userA.id })
    privateTestStream.id = await createStream({
      ...privateTestStream,
      ownerId: userA.id
    })
  })

  it('Should not allow download requests without an authorization token or valid streamId', async () => {
    // invalid token and streamId
    let res = await request(app)
      .get('/objects/wow_hack/null')
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(401)

    // private stream snooping is forbidden
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/maybeSomethingIsHere`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(401)

    // invalid token for public stream works
    res = await request(app)
      .get(`/objects/${testStream.id}/null`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(404)

    // invalid streamId
    res = await request(app)
      .get(`/objects/${'thisDoesNotExist'}/null`)
      .set('Authorization', userA.token)
    expect(res).to.have.status(404)

    // create some objects
    const objBatches = [createManyObjects(20), createManyObjects(20)]

    await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', userA.token)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objBatches[0]), 'utf8'))
      .attach('batch2', Buffer.from(JSON.stringify(objBatches[1]), 'utf8'))

    // should allow invalid tokens (treat them the same as no tokens?)
    res = await request(app)
      .get(`/objects/${testStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(200)

    // should not allow invalid tokens on private streams
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(401)

    // should not allow user b to access user a's private stream
    res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatches[0][0].id}`)
      .set('Authorization', userB.token)
    expect(res).to.have.status(401)
  })

  it('Should not allow getting an object that is not part of the stream', async () => {
    const objBatch = createManyObjects(20)

    await request(app)
      .post(`/objects/${privateTestStream.id}`)
      .set('Authorization', userA.token)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objBatch), 'utf8'))

    // should allow userA to access privateTestStream object
    let res = await request(app)
      .get(`/objects/${privateTestStream.id}/${objBatch[0].id}`)
      .set('Authorization', userA.token)
    expect(res).to.have.status(200)

    // should not allow userB to access privateTestStream object by pretending it's in public stream
    res = await request(app)
      .get(`/objects/${testStream.id}/${objBatch[0].id}`)
      .set('Authorization', userB.token)
    expect(res).to.have.status(404)
  })

  it('Should not allow upload requests without an authorization token or valid streamId', async () => {
    // invalid token and streamId
    let res = await request(app)
      .post('/objects/wow_hack')
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(401)

    // invalid token
    res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(401)

    // invalid streamId
    res = await request(app)
      .post(`/objects/${'thisDoesNotExist'}`)
      .set('Authorization', userA.token)
    expect(res).to.have.status(401)
  })

  let parentId
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
      .set('Authorization', userA.token)
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

  it('Should properly download an object, with all its children, into a application/json response', (done) => {
    new Promise((resolve) => setTimeout(resolve, 1500)) // avoids race condition
      .then(() => {
        request(app)
          .get(`/objects/${testStream.id}/${parentId}`)
          .set('Authorization', userA.token)
          .buffer()
          .parse((res, cb) => {
            res.data = ''
            res.on('data', (chunk) => {
              res.data += chunk.toString()
            })
            res.on('end', () => {
              cb(null, res.data)
            })
          })
          .end((err, res) => {
            if (err) done(err)
            try {
              const o = JSON.parse(res.body)
              expect(o.length).to.equal(numObjs + 1)
              expect(res).to.be.json
              done()
            } catch (err) {
              done(err)
            }
          })
      })
  })

  it('Should properly download an object, with all its children, into a text/plain response', (done) => {
    request(app)
      .get(`/objects/${testStream.id}/${parentId}`)
      .set('Authorization', userA.token)
      .set('Accept', 'text/plain')
      .buffer()
      .parse((res, cb) => {
        res.data = ''
        res.on('data', (chunk) => {
          res.data += chunk.toString()
        })
        res.on('end', () => {
          cb(null, res.data)
        })
      })
      .end((err, res) => {
        if (err) done(err)
        try {
          const o = res.body.split('\n').filter((l) => l !== '')
          expect(o.length).to.equal(numObjs + 1)
          expect(res).to.be.text
          done()
        } catch (err) {
          done(err)
        }
      })
  })

  it('Should properly download a list of objects', (done) => {
    const objectIds = []
    for (let i = 0; i < objBatches[0].length; i++) {
      objectIds.push(objBatches[0][i].id)
    }
    request(app)
      .post(`/api/getobjects/${testStream.id}`)
      .set('Authorization', userA.token)
      .set('Accept', 'text/plain')
      .send({ objects: JSON.stringify(objectIds) })
      .buffer()
      .parse((res, cb) => {
        res.data = ''
        res.on('data', (chunk) => {
          res.data += chunk.toString()
        })
        res.on('end', () => {
          cb(null, res.data)
        })
      })
      .end((err, res) => {
        if (err) done(err)
        try {
          const o = res.body.split('\n').filter((l) => l !== '')
          expect(o.length).to.equal(objectIds.length)
          expect(res).to.be.text
          done()
        } catch (err) {
          done(err)
        }
      })
  })

  it('Should properly check if the server has a list of objects', (done) => {
    const objectIds = []
    for (let i = 0; i < objBatches[0].length; i++) {
      objectIds.push(objBatches[0][i].id)
    }
    const fakeIds = []
    for (let i = 0; i < 100; i++) {
      const fakeId = crypto
        .createHash('md5')
        .update('fakefake' + i)
        .digest('hex')
      fakeIds.push(fakeId)
      objectIds.push(fakeId)
    }

    request(app)
      .post(`/api/diff/${testStream.id}`)
      .set('Authorization', userA.token)
      .send({ objects: JSON.stringify(objectIds) })
      .buffer()
      .parse((res, cb) => {
        res.data = ''
        res.on('data', (chunk) => {
          res.data += chunk.toString()
        })
        res.on('end', () => {
          cb(null, res.data)
        })
      })
      .end((err, res) => {
        if (err) done(err)
        try {
          const o = JSON.parse(res.body)
          expect(Object.keys(o).length).to.equal(objectIds.length)
          for (let i = 0; i < objBatches[0].length; i++) {
            assert(o[objBatches[0][i].id] === true, 'Server is missing an object')
          }
          for (let i = 0; i < fakeIds.length; i++) {
            assert(
              o[fakeIds[i]] === false,
              'Server wrongly reports it has an extra object'
            )
          }
          done()
        } catch (err) {
          done(err)
        }
      })
  })
})
