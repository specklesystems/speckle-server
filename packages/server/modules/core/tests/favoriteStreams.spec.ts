/* instanbul ignore file */
import { expect } from 'chai'

import { buildApolloServer } from '@/app'
import { StreamFavorites, Streams, Users } from '@/modules/core/dbSchema'
import { truncateTables } from '@/test/hooks'
import gql from 'graphql-tag'
import { sleep } from '@/test/helpers'
import type { ServerAndContext } from '@/test/graphqlHelper'
import {
  createAuthedTestContext,
  createTestContext,
  executeOperation
} from '@/test/graphqlHelper'
import {
  getStreamFactory,
  createStreamFactory,
  grantStreamPermissionsFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findInviteFactory,
  deleteInvitesByTargetFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

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
        getServerInfo,
        finalizeInvite: buildFinalizeProjectInvite()
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    emitEvent: getEventBus().emit
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
  storeUser: replicateQuery([db], storeUserFactory),
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
  emitEvent: getEventBus().emit
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
    isPublic: false,
    id: ''
  }
  const myStream = {
    name: 'My Stream 2',
    isPublic: true,
    id: ''
  }
  const notMyStream = {
    name: 'Not My Stream 1',
    isPublic: false,
    id: ''
  }
  const notMyPubStream = {
    name: 'Not My Stream 2',
    isPublic: true,
    id: ''
  }
  const me = {
    name: 'Itsa Me',
    email: 'me@example.org',
    password: 'sn3aky-1337-b1m',
    id: ''
  }
  const otherGuy = {
    name: 'Some Other DUde',
    email: 'otherguy@example.org',
    password: 'sn3aky-1337-b1m',
    id: ''
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
    let apollo: ServerAndContext

    const favoriteStream = async (sid: string, favorited: boolean) =>
      await executeOperation(apollo, favoriteMutationGql, { sid, favorited })

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }

      // Drop all favorites to ensure we don't favorite already favorited streams
      await StreamFavorites.knex().truncate()
    })

    const accessibleStreamIds = <const>[
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
          (t: number) => t > beforeTime && t < afterTime
        )
        expect(result.data?.streamFavorite?.id).to.equal(streamId)
        expect(result.data?.streamFavorite?.favoritesCount).to.equal(1)
      })
    })

    it("can't be favorited if not owned and not public", async () => {
      const result = await favoriteStream(notMyStream.id, true)

      expect(result.data!.streamFavorite).to.not.be.ok
      expect(result.errors).to.have.lengthOf(1)
      expect(result.errors!.at(0)!.message).to.contain("doesn't have access")
    })

    describe('and favorited', () => {
      const favoritedStream = {
        name: 'Favorited Stream',
        isPublic: true,
        id: ''
      }

      let favoritingResults: { favoritedDate: Date; favoritesCount: number; id: string }

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
        { name: 'Random 1', isPublic: true, id: '' },
        { name: 'Random 2', isPublic: true, id: '' },
        { name: 'Random 2', isPublic: true, id: '' }
      ]

      const getFavorites = async (cursor: string | null, limit = 10) =>
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
        expect(data!.otherUser?.favoriteStreams).to.not.be.ok
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
        expect(results.data!.activeUser.favoriteStreams.totalCount).to.equal(ids.length)
        expect(results.data!.activeUser.favoriteStreams.cursor).to.be.a('string')
      })

      it('are paginated correctly', async () => {
        let nextCursor = null
        let returnedStreamIds: string[] = []

        const getPaginatedAndAssert = async (nextCursor: string | null) => {
          const results = await getFavorites(nextCursor, 1)
          expect(results.errors).to.not.be.ok
          expect(results.data?.activeUser?.favoriteStreams).to.be.ok

          return {
            cursor: results.data!.activeUser.favoriteStreams.cursor,
            sids: results.data!.activeUser.favoriteStreams.items.map(
              (i: { id: string }) => i.id
            )
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
    let apollo: ServerAndContext

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

      expect(result.data!.streamFavorite).to.not.be.ok
      expect(result.errors).to.have.lengthOf(1)
      expect(result.errors!.at(0)!.message).to.contain('Must provide an auth token')
    })

    it("can't be retrieved", async () => {
      const result = await executeOperation(apollo, favoriteStreamsQueryGql)

      expect(result.data!.activeUser).to.be.null
      expect(result.errors).to.not.be.ok
    })
  })
})
