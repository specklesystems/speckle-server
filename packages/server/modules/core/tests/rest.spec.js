/* istanbul ignore file */
const expect = require('chai').expect
const request = require('supertest')

const assert = require('assert')
const crypto = require('crypto')

const { beforeEachContext } = require('@/test/hooks')
const { createManyObjects } = require('@/test/helpers')

const { Scopes } = require('@speckle/shared')
const {
  getStreamFactory,
  createStreamFactory
} = require('@/modules/core/repositories/streams')
const { db } = require('@/db/knex')
const {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} = require('@/modules/core/services/streams/management')
const {
  inviteUsersToProjectFactory
} = require('@/modules/serverinvites/services/projectInviteManagement')
const {
  createAndSendInviteFactory
} = require('@/modules/serverinvites/services/creation')
const {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const { createPersonalAccessTokenFactory } = require('@/modules/core/services/tokens')
const {
  storeTokenScopesFactory,
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory
} = require('@/modules/core/repositories/tokens')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
})
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

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

    userB.id = await createUser(userB)
    userB.token = `Bearer ${await createPersonalAccessToken(
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
      .set('Authorization', userB.token)
    expect(res).to.have.status(401)
  })

  it('should not allow a non-multipart/form-data request without a boundary', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', userA.token)
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
      .set('Authorization', userA.token)
      .set('Content-type', 'application/json')
      .attach(Buffer.from(JSON.stringify(objBatches[0]), 'utf8'))
    expect(res).to.have.status(400)
    expect(res.text).to.equal(
      'Failed to parse request headers and body content as valid multipart/form-data.'
    )
  })

  it('should not allow non-buffered requests', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', userA.token)
      .set('Content-type', 'multipart/form-data')
      .attach(JSON.stringify(objBatches[0], 'utf8'))
    expect(res).to.have.status(400)
    expect(res.text).to.equal(
      'Failed to parse request headers and body content as valid multipart/form-data.'
    )
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
    expect(res).to.have.status(403)

    // invalid token
    res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', 'this is a hoax')
    expect(res).to.have.status(403)

    // invalid streamId
    res = await request(app)
      .post(`/objects/${'thisDoesNotExist'}`)
      .set('Authorization', userA.token)
    expect(res).to.have.status(401)
  })

  it('Should not allow upload with invalid body (not contained within array)', async () => {
    //creating a single valid object
    const objectToPost = {
      name: 'yet again cannot believe i have to create this'
    }
    const objectId = crypto
      .createHash('md5')
      .update(JSON.stringify(objectToPost))
      .digest('hex')
    objectToPost.id = objectId

    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', userA.token)
      .set('Content-type', 'multipart/form-data')
      .attach('batch1', Buffer.from(JSON.stringify(objectToPost), 'utf8'))

    expect(res).to.have.status(400)
  })

  it('Should not allow upload with invalid body (invalid json)', async () => {
    const res = await request(app)
      .post(`/objects/${testStream.id}`)
      .set('Authorization', userA.token)
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
  //     .set('Authorization', userA.token)
  //     .set('Content-type', 'multipart/form-data')
  //     .attach('batch1', Buffer.from(JSON.stringify([objectToPost]), 'utf8'))

  //   expect(res).to.have.status(400)
  //   expect(res.text).contains('Object too large')
  // })

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
          done()
        } catch (err) {
          done(err)
        }
      })
  })
})
