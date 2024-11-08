/* instanbul ignore file */
const expect = require('chai').expect

const { buildApolloServer } = require('@/app')
const { StreamFavorites, Streams, Users } = require('@/modules/core/dbSchema')
const { truncateTables } = require('@/test/hooks')
const { gql } = require('graphql-tag')
const { sleep } = require('@/test/helpers')
const {
  createAuthedTestContext,
  createTestContext,
  executeOperation
} = require('@/test/graphqlHelper')
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

/**
 * Cleaning up relevant tables
 */
async function cleanup() {
  await truncateTables([StreamFavorites.name, Streams.name, Users.name])
}

const favoriteMutationGql = gql`
  mutation ($sid: String!, $favorited: Boolean!) {
    streamFavorite(streamId: $sid, favorited: $favorited) {
      id
      favoritedDate
      favoritesCount
    }
  }
`

const favoriteStreamsQueryGql = gql`
  query ($cursor: String, $limit: Int! = 10) {
    activeUser {
      id
      favoriteStreams(cursor: $cursor, limit: $limit) {
        totalCount
        cursor
        items {
          id
        }
      }
    }
  }
`

/**
 * @deprecated Leaving this behind while we still have the old user() query. This should
 * be deleted afterwards
 */
const anotherUserFavoriteStreamsQueryGql = gql`
  query ($cursor: String, $limit: Int! = 10, $uid: String!) {
    user(id: $uid) {
      id
      favoriteStreams(cursor: $cursor, limit: $limit) {
        totalCount
        cursor
        items {
          id
        }
      }
    }
  }
`

/**
 * @deprecated Leaving this behind while we still have the old user() query. This should
 * be deleted afterwards
 */
const totalOwnedStreamsFavoritesOld = gql`
  query ($uid: String!) {
    user(id: $uid) {
      id
      totalOwnedStreamsFavorites
    }
  }
`

const totalOwnedStreamsFavoritesNew = gql`
  query ($uid: String!) {
    otherUser(id: $uid) {
      id
      totalOwnedStreamsFavorites
    }
  }
`

describe('Favorite streams', () => {
  const myPubStream = {
    name: 'My Stream 1',
    isPublic: false
  }
  const myStream = {
    name: 'My Stream 2',
    isPublic: true
  }
  const notMyStream = {
    name: 'Not My Stream 1',
    isPublic: false
  }
  const notMyPubStream = {
    name: 'Not My Stream 2',
    isPublic: true
  }
  const me = {
    name: 'Itsa Me',
    email: 'me@gmail.com',
    password: 'sn3aky-1337-b1m'
  }
  const otherGuy = {
    name: 'Some Other DUde',
    email: 'otherguy@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before(async function () {
    await cleanup()

    // Seeding
    await Promise.all([
      createUser(me).then((id) => (me.id = id)),
      createUser(otherGuy).then((id) => (otherGuy.id = id))
    ])

    await Promise.all([
      createStream({ ...myPubStream, ownerId: me.id }).then(
        (id) => (myPubStream.id = id)
      ),
      createStream({ ...myStream, ownerId: me.id }).then((id) => (myStream.id = id)),
      createStream({ ...notMyStream, ownerId: otherGuy.id }).then(
        (id) => (notMyStream.id = id)
      ),
      createStream({ ...notMyPubStream, ownerId: otherGuy.id }).then(
        (id) => (notMyPubStream.id = id)
      )
    ])
  })

  after(async () => {
    await cleanup()
  })

  describe('when authenticated', () => {
    /** @type {import('@/test/graphqlHelper').ServerAndContext} */
    let apollo

    const favoriteStream = async (sid, favorited) =>
      await executeOperation(apollo, favoriteMutationGql, { sid, favorited })

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }

      // Drop all favorites to ensure we don't favorite already favorited streams
      await StreamFavorites.knex().truncate()
    })

    const accessibleStreamIds = [
      [() => myPubStream.id, 'owned and public'],
      [() => myStream.id, 'owned and not public'],
      [() => notMyPubStream.id, 'not owned, but public']
    ]

    accessibleStreamIds.forEach(([id, msgSuffix]) => {
      it(`can be favorited if ${msgSuffix}`, async () => {
        const streamId = id()
        const beforeTime = Date.now()
        await sleep(1)
        const result = await favoriteStream(streamId, true)
        await sleep(1)
        const afterTime = Date.now()

        expect(result.errors).to.not.be.ok
        expect(result.data?.streamFavorite?.favoritedDate).to.be.a('date')
        expect(result.data?.streamFavorite?.favoritedDate.getTime()).to.satisfy(
          (t) => t > beforeTime && t < afterTime
        )
        expect(result.data?.streamFavorite?.id).to.equal(streamId)
        expect(result.data?.streamFavorite?.favoritesCount).to.equal(1)
      })
    })

    it("can't be favorited if not owned and not public", async () => {
      const result = await favoriteStream(notMyStream.id, true)

      expect(result.data.streamFavorite).to.not.be.ok
      expect(result.errors).to.have.lengthOf(1)
      expect(result.errors.at(0).message).to.contain("doesn't have access")
    })

    describe('and favorited', () => {
      const favoritedStream = {
        name: 'Favorited Stream',
        isPublic: true
      }

      /** @type {{favoritedDate: Date, favoritesCount: number, id: string}} */
      let favoritingResults

      before(async () => {
        favoritedStream.id = await createStream({ ...favoritedStream, ownerId: me.id })
      })

      beforeEach(async () => {
        const favoritingResult = await favoriteStream(favoritedStream.id, true)
        favoritingResults = favoritingResult.data?.streamFavorite
      })

      it('can be favorited again without changing anything', async () => {
        const result = await favoriteStream(favoritedStream.id, true)

        expect(result.errors).to.not.be.ok
        expect(result.data?.streamFavorite).to.deep.equalInAnyOrder(favoritingResults)
      })

      it('can be unfavorited', async () => {
        const result = await favoriteStream(favoritedStream.id, false)
        expect(result.errors).to.not.be.ok
        expect(result.data?.streamFavorite).to.deep.equalInAnyOrder({
          id: favoritedStream.id,
          favoritedDate: null,
          favoritesCount: 0
        })
      })
    })

    describe('and being queried', () => {
      const favoritableStreams = [
        { name: 'Random 1', isPublic: true },
        { name: 'Random 2', isPublic: true },
        { name: 'Random 2', isPublic: true }
      ]

      const getFavorites = async (cursor, limit = 10) =>
        await executeOperation(apollo, favoriteStreamsQueryGql, { cursor, limit })

      const favoritedStreamIds = () => favoritableStreams.map((s) => s.id)

      before(async () => {
        // Drop all favorites to ensure we're working with a clean slate
        await StreamFavorites.knex().truncate()

        // Create new ones
        await Promise.all(
          favoritableStreams.map((s) =>
            createStream({ ...s, ownerId: me.id }).then((id) => (s.id = id))
          )
        )

        // Pre-favorite all streams
        await Promise.all(
          favoritedStreamIds().map(async (id) => favoriteStream(id, true))
        )
      })

      it("throw error if trying to get another user's favorite stream collection", async () => {
        const { data, errors } = await executeOperation(
          apollo,
          anotherUserFavoriteStreamsQueryGql,
          { limit: 10, uid: otherGuy.id }
        )

        expect(data).to.be.ok
        expect(data.otherUser?.favoriteStreams).to.not.be.ok
        expect((errors || []).map((e) => e.message).join()).to.match(
          /cannot view another user's favorite streams/i
        )
      })

      it('return valid stream collection', async () => {
        const results = await getFavorites(null, 10)
        const ids = favoritedStreamIds()

        expect(results.errors).to.not.be.ok
        expect(results.data?.activeUser?.favoriteStreams?.items).to.have.lengthOf(
          ids.length
        )
        expect(results.data.activeUser.favoriteStreams.totalCount).to.equal(ids.length)
        expect(results.data.activeUser.favoriteStreams.cursor).to.be.a('string')
      })

      it('are paginated correctly', async () => {
        let nextCursor = null
        let returnedStreamIds = []

        const getPaginatedAndAssert = async (nextCursor) => {
          const results = await getFavorites(nextCursor, 1)
          expect(results.errors).to.not.be.ok
          expect(results.data?.activeUser?.favoriteStreams).to.be.ok

          return {
            cursor: results.data.activeUser.favoriteStreams.cursor,
            sids: results.data.activeUser.favoriteStreams.items.map((i) => i.id)
          }
        }

        let failsafe = 3
        while (failsafe > 0) {
          const res = await getPaginatedAndAssert(nextCursor)
          returnedStreamIds = returnedStreamIds.concat(res.sids)
          nextCursor = res.cursor

          failsafe--
          if (returnedStreamIds.length < 0) break
        }

        expect(returnedStreamIds).to.deep.equalInAnyOrder(favoritedStreamIds())
      })

      const oldNewQueryDataset = [
        { display: 'old', isNew: false },
        { display: 'new', isNew: true }
      ]

      oldNewQueryDataset.forEach(({ display, isNew }) => {
        it(`return total favorites count for user (${display} query)`, async () => {
          // "Log in" with other user
          const apollo = {
            apollo: await buildApolloServer(),
            context: await createAuthedTestContext(otherGuy.id)
          }

          const { data, errors } = await executeOperation(
            apollo,
            isNew ? totalOwnedStreamsFavoritesNew : totalOwnedStreamsFavoritesOld,
            { uid: me.id }
          )

          expect(errors).to.not.be.ok

          const user = isNew ? data?.otherUser : data?.user
          expect(user?.id).to.equal(me.id)
          expect(user?.totalOwnedStreamsFavorites).to.equal(favoritableStreams.length)
        })
      })
    })
  })

  describe('when not authenticated', () => {
    /** @type {import('@/test/graphqlHelper').ServerAndContext} */
    let apollo

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createTestContext()
      }
    })

    it("can't be favorited", async () => {
      const result = await executeOperation(apollo, favoriteMutationGql, {
        sid: myPubStream.id,
        favorited: true
      })

      expect(result.data.streamFavorite).to.not.be.ok
      expect(result.errors).to.have.lengthOf(1)
      expect(result.errors.at(0).message).to.contain('Must provide an auth token')
    })

    it("can't be retrieved", async () => {
      const result = await executeOperation(apollo, favoriteStreamsQueryGql)

      expect(result.data.activeUser).to.be.null
      expect(result.errors).to.not.be.ok
    })
  })
})
