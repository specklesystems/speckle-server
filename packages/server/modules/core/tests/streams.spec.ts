import { expect } from 'chai'
import {
  createStream,
  getStream,
  updateStream,
  deleteStream,
  getStreamUsers,
  grantPermissionsStream,
  revokePermissionsStream
} from '../services/streams'
import {
  createBranch,
  getBranchByNameAndStreamId,
  deleteBranchById
} from '../services/branches'
import { createObject } from '../services/objects'
import { createCommitByBranchName } from '../services/commits'

import { beforeEachContext } from '@/test/hooks'
import {
  addOrUpdateStreamCollaborator,
  validateStreamAccess
} from '@/modules/core/services/streams/streamAccessService'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  buildAuthenticatedApolloServer,
  buildUnauthenticatedApolloServer
} from '@/test/serverHelper'
import { leaveStream } from '@/test/graphql/streams'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'

describe('Streams @core-streams', () => {
  const userOne: BasicTestUser = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const userTwo: BasicTestUser = {
    name: 'Dimitrie Stefanescu 2',
    email: 'didimitrie2@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const testStream: BasicTestStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream',
    isPublic: true,
    ownerId: '',
    id: ''
  }

  const secondTestStream: BasicTestStream = {
    name: 'Test Stream 02',
    description: 'wot',
    isPublic: false,
    ownerId: '',
    id: ''
  }

  before(async () => {
    await beforeEachContext()

    await createTestUsers([userOne, userTwo])
    await createTestStreams([
      [testStream, userOne],
      [secondTestStream, userOne]
    ])
  })

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
        id: testStream.id,
        name: 'Modified Name',
        description: 'Wooot'
      })
      const stream = await getStream({ streamId: testStream.id })
      expect(stream?.name).to.equal('Modified Name')
      expect(stream?.description).to.equal('Wooot')
    })

    // it('Should get all streams of a user', async () => {
    //   const { streams, cursor } = await getUserStreams({ userId: userOne.id })

    //   expect(streams).to.be.ok
    //   expect(cursor).to.be.ok
    //   expect(streams).to.not.be.empty
    // })

    // it('Should search all streams of a user', async () => {
    //   const { streams, cursor } = await getUserStreams({
    //     userId: userOne.id,
    //     searchQuery: 'woo'
    //   })
    //   // console.log( res )
    //   expect(streams).to.have.lengthOf(1)
    //   expect(cursor).to.exist
    // })

    it('Should delete a stream', async () => {
      const id = await createStream({
        name: 'mayfly',
        description: 'wonderful',
        ownerId: userOne.id
      })

      await deleteStream({ streamId: id })
      const stream = await getStream({ streamId: id })

      expect(stream).to.not.be.ok
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

    // it('Stream should show up in the other users` list', async () => {
    //   const { streams: userTwoStreams } = await getUserStreams({ userId: userTwo.id })

    //   expect(userTwoStreams).to.have.lengthOf(1)
    //   expect(userTwoStreams[0]).to.have.property('role')
    //   expect(userTwoStreams[0].role).to.equal('stream:contributor')
    // })

    it('Should get the users with access to a stream', async () => {
      const users = await getStreamUsers({ streamId: testStream.id })
      expect(users).to.have.lengthOf(2)
      expect(users[0]).to.not.have.property('email')
      expect(users[0]).to.have.property('id')
    })

    it('Should revoke permissions on stream', async () => {
      await revokePermissionsStream({ streamId: testStream.id, userId: userTwo.id })
      const streamWithRole = await getStream({
        streamId: testStream.id,
        userId: userTwo.id
      })
      expect(streamWithRole?.role).to.be.not.ok
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
    let updatableStream: StreamWithOptionalRole

    before(async () => {
      const id = await createStream({
        name: 'T1',
        ownerId: userOne.id,
        isPublic: false
      })
      const newStream = await getStream({ streamId: id })
      if (!newStream) throw new Error("Couldn't create stream")

      updatableStream = newStream
    })

    afterEach(async () => {
      // refresh updatedAt
      const stream = await getStream({ streamId: updatableStream.id })
      if (!stream) throw new Error("Couldn't create stream")
      updatableStream = stream
    })

    it('Should update stream updatedAt on stream update ', async () => {
      await updateStream({ id: updatableStream.id, name: 'TU1' })
      const su = await getStream({ streamId: updatableStream.id })

      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(updatableStream.updatedAt)
    })

    it('Should update stream updatedAt on sharing operations ', async () => {
      let lastUpdatedAt = updatableStream.updatedAt

      await grantPermissionsStream({
        streamId: updatableStream.id,
        userId: userTwo.id,
        role: 'stream:contributor'
      })

      // await sleep(100)
      let su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
      lastUpdatedAt = su!.updatedAt

      await revokePermissionsStream({
        streamId: updatableStream.id,
        userId: userTwo.id
      })

      // await sleep(100)

      su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
    })

    it('Should update stream updatedAt on branch operations ', async () => {
      let lastUpdatedAt = updatableStream.updatedAt

      await createBranch({
        name: 'dim/lol',
        streamId: updatableStream.id,
        authorId: userOne.id,
        description: 'ayyyy'
      })

      const su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(lastUpdatedAt)
      lastUpdatedAt = su!.updatedAt

      // await sleep(100)

      const b = await getBranchByNameAndStreamId({
        streamId: updatableStream.id,
        name: 'dim/lol'
      })
      await deleteBranchById({ id: b.id, streamId: updatableStream.id })

      const su2 = await getStream({ streamId: updatableStream.id })
      expect(su2?.updatedAt).to.be.ok
      expect(su2!.updatedAt).to.not.equal(lastUpdatedAt)
    })

    it('Should update stream updatedAt on commit operations ', async () => {
      const testObject = { foo: 'bar', baz: 'qux', id: '' }
      testObject.id = await createObject(updatableStream.id, testObject)

      await createCommitByBranchName({
        streamId: updatableStream.id,
        branchName: 'main',
        message: 'first commit',
        objectId: testObject.id,
        authorId: userOne.id,
        sourceApplication: 'tests',
        totalChildrenCount: null,
        parents: null
      })

      const su = await getStream({ streamId: updatableStream.id })
      expect(su?.updatedAt).to.be.ok
      expect(su!.updatedAt).to.not.equal(updatableStream.updatedAt)
    })
  })

  describe.skip('when reading streams', () => {
    // TODO: WIP

    describe('and user is authenticated', () => {
      /** @type {ApolloServer} */
      let apollo

      before(async () => {
        apollo = buildAuthenticatedApolloServer(userOne.id)
      })

      it(
        'User.streams()/Query.streams() for active user returns all streams the user is a collaborator on, even other ppls'
      )

      it('User.streams()/Query.streams() pagination and filtering works')

      it(
        'User.streams() for a different user only returns that users discoverable streams'
      )
    })

    describe('and user is not authenticated', () => {
      /** @type {ApolloServer} */
      let apollo

      before(async () => {
        apollo = buildUnauthenticatedApolloServer()
      })

      it('Query.streams() is inaccessible')

      it('User.streams() only returns a users discoverable streams')

      it('User.streams()/Query.streams() pagination and filtering works')
    })
  })
})
