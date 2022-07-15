/* istanbul ignore file */
const expect = require('chai').expect

const { createUser } = require('../services/users')
const {
  createStream,
  getStream,
  updateStream,
  deleteStream,
  getUserStreams,
  getStreamUsers,
  grantPermissionsStream,
  revokePermissionsStream
} = require('../services/streams')
const {
  createBranch,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require('../services/branches')
const { createObject } = require('../services/objects')
const { createCommitByBranchName } = require('../services/commits')

const { beforeEachContext } = require('@/test/hooks')
const { sleep } = require('@/test/helpers')
const {
  addOrUpdateStreamCollaborator,
  validateStreamAccess
} = require('@/modules/core/services/streams/streamAccessService')
const { Roles } = require('@/modules/core/helpers/mainConstants')
const { buildAuthenticatedApolloServer } = require('@/test/serverHelper')
const { leaveStream } = require('@/test/graphql/streams')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')

describe('Streams @core-streams', () => {
  const userOne = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  const userTwo = {
    name: 'Dimitrie Stefanescu 2',
    email: 'didimitrie2@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before(async () => {
    await beforeEachContext()

    userOne.id = await createUser(userOne)
    userTwo.id = await createUser(userTwo)

    testStream.id = await createStream({ ...testStream, ownerId: userOne.id })
    secondTestStream.id = await createStream({
      ...secondTestStream,
      ownerId: userOne.id
    })
  })

  const testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream',
    isPublic: true
  }

  const secondTestStream = { name: 'Test Stream 02', description: 'wot' }

  describe('Create, Read, Update, Delete Streams', () => {
    it('Should create a stream', async () => {
      const stream1Id = await createStream({ ...testStream, ownerId: userOne.id })
      expect(stream1Id).to.not.be.null

      const stream2Id = await createStream({
        ...secondTestStream,
        ownerId: userOne.id
      })
      expect(stream2Id).to.not.be.null
    })

    it('Should get a stream', async () => {
      const stream = await getStream({ streamId: testStream.id })
      expect(stream).to.not.be.null
    })

    it('Should update a stream', async () => {
      await updateStream({
        streamId: testStream.id,
        name: 'Modified Name',
        description: 'Wooot'
      })
      const stream = await getStream({ streamId: testStream.id })
      expect(stream.name).to.equal('Modified Name')
      expect(stream.description).to.equal('Wooot')
    })

    it('Should get all streams of a user', async () => {
      const { streams, cursor } = await getUserStreams({ userId: userOne.id })
      // console.log( res )
      expect(streams).to.have.lengthOf(2)
      expect(cursor).to.exist
    })

    it('Should search all streams of a user', async () => {
      const { streams, cursor } = await getUserStreams({
        userId: userOne.id,
        searchQuery: 'woo'
      })
      // console.log( res )
      expect(streams).to.have.lengthOf(1)
      expect(cursor).to.exist
    })

    it('Should delete a stream', async () => {
      const id = await createStream({
        name: 'mayfly',
        description: 'wonderful',
        ownerId: userOne.id
      })
      let all = await getUserStreams({ userId: userOne.id })
      expect(all.streams).to.have.lengthOf(3)

      await deleteStream({ streamId: id })

      all = await getUserStreams({ userId: userOne.id })
      expect(all.streams).to.have.lengthOf(2)
    })
  })

  describe('Sharing: Grant & Revoke permissions', () => {
    before(async () => {
      await addOrUpdateStreamCollaborator(
        testStream.id,
        userTwo.id,
        Roles.Stream.Contributor,
        userOne.id
      )
    })

    it('Stream should show up in the other users` list', async () => {
      const { streams: userTwoStreams } = await getUserStreams({ userId: userTwo.id })

      expect(userTwoStreams).to.have.lengthOf(1)
      expect(userTwoStreams[0]).to.have.property('role')
      expect(userTwoStreams[0].role).to.equal('stream:contributor')
    })

    it('Should get the users with access to a stream', async () => {
      const users = await getStreamUsers({ streamId: testStream.id })
      expect(users).to.have.lengthOf(2)
      expect(users[0]).to.not.have.property('email')
      expect(users[0]).to.have.property('id')
    })

    it('Should revoke permissions on stream', async () => {
      await revokePermissionsStream({ streamId: testStream.id, userId: userTwo.id })
      const { streams: userTwoStreams } = await getUserStreams({ userId: userTwo.id })
      expect(userTwoStreams).to.have.lengthOf(0)
    })

    it('Should not revoke owner permissions', async () => {
      await revokePermissionsStream({ streamId: testStream.id, userId: userOne.id })
        .then(() => {
          throw new Error('This should have thrown')
        })
        .catch((err) => {
          expect(err.message).to.include('cannot revoke permissions.')
        })
    })

    it('Collaborator can leave a stream on his own', async () => {
      const streamId = await createStream({
        name: 'test streammmmm',
        description: 'ayy',
        isPublic: false,
        ownerId: userOne.id
      })
      await addOrUpdateStreamCollaborator(
        streamId,
        userTwo.id,
        Roles.Stream.Reviewer,
        userOne.id
      )

      const apollo = buildAuthenticatedApolloServer(userTwo.id)
      const { data, errors } = await leaveStream(apollo, { streamId })

      expect(errors).to.be.not.ok
      expect(data?.streamLeave).to.be.ok

      let accessNotFound = false
      await validateStreamAccess(userTwo.id, streamId, Roles.Stream.Reviewer).catch(
        (e) => {
          if (e instanceof StreamInvalidAccessError) {
            accessNotFound = true
          } else {
            throw e
          }
        }
      )
      expect(accessNotFound).to.be.ok
    })
  })

  describe('`UpdatedAt` prop update', () => {
    let s = {
      name: 'T1'
    }

    it('Should update stream updatedAt on stream update ', async () => {
      s.id = await createStream({ ...s, ownerId: userOne.id })
      s = await getStream({ streamId: s.id })

      await sleep(100)

      await updateStream({ streamId: s.id, name: 'TU1' })
      const su = await getStream({ streamId: s.id })

      expect(su.updatedAt).to.not.equal(s.updatedAt)
    })

    it('Should update stream updatedAt on sharing operations ', async () => {
      s = await getStream({ streamId: s.id })

      await grantPermissionsStream({
        streamId: s.id,
        userId: userTwo.id,
        role: 'stream:contributor'
      })

      await sleep(100)
      let su = await getStream({ streamId: s.id })
      expect(su.updatedAt).to.not.equal(s.updatedAt)

      await revokePermissionsStream({ streamId: s.id, userId: userTwo.id })

      await sleep(100)
      su = await getStream({ streamId: s.id })
      expect(su.updatedAt).to.not.equal(s.updatedAt)
    })

    it('Should update stream updatedAt on branch operations ', async () => {
      s = await getStream({ streamId: s.id })

      await sleep(100)
      await createBranch({ name: 'dim/lol', streamId: s.id, authorId: userOne.id })
      const su = await getStream({ streamId: s.id })
      expect(su.updatedAt).to.not.equal(s.updatedAt)

      await sleep(100)
      const b = await getBranchByNameAndStreamId({ streamId: s.id, name: 'dim/lol' })
      await deleteBranchById({ id: b.id, streamId: s.id })
      const su2 = await getStream({ streamId: s.id })
      expect(su2.updatedAt).to.not.equal(su.updatedAt)
    })

    it('Should update stream updatedAt on commit operations ', async () => {
      s = await getStream({ streamId: s.id })

      await sleep(100)
      const testObject = { foo: 'bar', baz: 'qux' }
      testObject.id = await createObject(s.id, testObject)
      await createCommitByBranchName({
        streamId: s.id,
        branchName: 'main',
        message: 'first commit',
        objectId: testObject.id,
        authorId: userOne.id,
        sourceApplication: 'tests'
      })

      const su = await getStream({ streamId: s.id })
      expect(su.updatedAt).to.not.equal(s.updatedAt)
    })
  })
})
