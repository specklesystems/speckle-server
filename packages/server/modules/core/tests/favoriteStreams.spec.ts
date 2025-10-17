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
import { createTestUser, type BasicTestUser } from '@/test/authHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'

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
  let myPubStream: BasicTestStream
  let myStream: BasicTestStream
  let notMyStream: BasicTestStream
  let notMyPubStream: BasicTestStream
  let me: BasicTestUser
  let otherGuy: BasicTestUser

  before(async function () {
    await cleanup()

    me = await createTestUser({
      name: 'Itsa Me',
      email: 'me@example.org',
      password: 'sn3aky-1337-b1m',
      id: ''
    })
    otherGuy = await createTestUser({
      name: 'Some Other DUde',
      email: 'otherguy@example.org',
      password: 'sn3aky-1337-b1m',
      id: ''
    })

    myPubStream = await createTestStream(
      buildBasicTestProject({
        name: 'My Stream 1',
        isPublic: false
      }),
      me
    )
    myStream = await createTestStream(
      buildBasicTestProject({
        name: 'My Stream 2',
        isPublic: true
      }),
      me
    )
    notMyStream = await createTestStream(
      buildBasicTestProject({
        name: 'Not My Stream 1',
        isPublic: false
      }),
      otherGuy
    )
    notMyPubStream = await createTestStream(
      buildBasicTestProject({
        name: 'Not My Stream 2',
        isPublic: true
      }),
      otherGuy
    )
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
      expect(result.errors!.at(0)!.message).to.contain(
        "User doesn't have access to the specified stream"
      )
    })

    describe('and favorited', () => {
      let favoritedStream: BasicTestStream

      let favoritingResults: { favoritedDate: Date; favoritesCount: number; id: string }

      before(async () => {
        favoritedStream = await createTestStream(
          buildBasicTestProject({
            name: 'Favorited Stream',
            isPublic: true,
            id: ''
          }),
          me
        )
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
            createTestStream(buildBasicTestProject(s), me).then(({ id }) => (s.id = id))
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
