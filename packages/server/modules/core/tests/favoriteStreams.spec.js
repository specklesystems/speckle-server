/* instanbul ignore file */
const expect = require('chai').expect

const { buildApolloServer } = require('@/app')
const { StreamFavorites, Streams, Users, knex } = require('@/modules/core/dbSchema')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const { createStream } = require('@/modules/core/services/streams')
const { createUser } = require('@/modules/core/services/users')
const { addLoadersToCtx } = require('@/modules/shared')
const { truncateTables, beforeEachContext } = require('@/test/hooks')
const { gql } = require('apollo-server-express')

/*
 * TODO: Extra tests
 * - Test for new error handler, checking if exceptions are reported correctly in responses
 */

/**
 * Cleaning up relevant tables
 */
async function cleanup(startingUp) {
  await beforeEachContext()
  // if (startingUp) {
  //   await truncateTables([StreamFavorites.name, Streams.name, Users.name])
  //   await knex.connectionTransaction(true)
  // } else {
  //   await knex.connectionTransaction(false)
  // }
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
    user {
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
  let me = {
    name: 'Itsa Me',
    email: 'me@gmail.com',
    password: 'sn3aky-1337-b1m'
  }
  let otherGuy = {
    name: 'Some Other DUde',
    email: 'otherguy@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before(async function () {
    await cleanup(true)

    // Seeding
    await Promise.all([
      createUser(me).then((id) => (me.id = id)),
      createUser(otherGuy).then((id) => (otherGuy.id = id))
    ])

    await Promise.all([
      createStream({ ...myPubStream, ownerId: me.id }).then((id) => (myPubStream.id = id)),
      createStream({ ...myStream, ownerId: me.id }).then((id) => (myStream.id = id)),
      createStream({ ...notMyStream, ownerId: otherGuy.id }).then((id) => (notMyStream.id = id)),
      createStream({ ...notMyPubStream, ownerId: otherGuy.id }).then(
        (id) => (notMyPubStream.id = id)
      )
    ])
  })

  after(async () => {
    await cleanup(false)
  })

  describe('when authenticated', () => {
    /** @type {import('apollo-server-express').ApolloServer} */
    let apollo

    const favoriteStream = async (sid, favorited) =>
      await apollo.executeOperation({
        query: favoriteMutationGql,
        variables: { sid, favorited }
      })

    before(async () => {
      apollo = buildApolloServer({
        context: () =>
          addLoadersToCtx({
            auth: true,
            userId: me.id,
            role: Roles.Server.User,
            token: 'asd',
            scopes: AllScopes
          })
      })

      // Drop all favorites to ensure we don't favorite already favorited streams
      await StreamFavorites.knex().truncate()
    })

    const accessibleStreamIds = [
      [() => myPubStream.id, 'owned and public'],
      [() => myStream.id, 'owned and not public'],
      [() => notMyPubStream.id, 'not owened, but public']
    ]

    accessibleStreamIds.forEach(([id, msgSuffix]) => {
      it(`can be favorited if ${msgSuffix}`, async () => {
        const streamId = id()
        const beforeTime = Date.now()
        const result = await favoriteStream(streamId, true)
        const afterTime = Date.now()

        expect(result.errors).to.not.be.ok
        expect(result.data?.streamFavorite?.favoritedDate).to.be.a('date')
        expect(result.data?.streamFavorite?.favoritedDate.getTime()).to.satisfy(
          (t) => true // t > beforeTime && t < afterTime
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
      let favoritedStream = {
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

    describe('and being retrieved', () => {
      const favoritableStreams = [
        { name: 'Random 1', isPublic: true },
        { name: 'Random 2', isPublic: true },
        { name: 'Random 2', isPublic: true }
      ]

      const getFavorites = async (cursor, limit = 10) =>
        await apollo.executeOperation({
          query: favoriteStreamsQueryGql,
          variables: { cursor, limit }
        })

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
        await Promise.all(favoritedStreamIds().map(async (id) => favoriteStream(id, true)))
      })

      it('return valid stream collection', async () => {
        const results = await getFavorites(null, 10)
        const ids = favoritedStreamIds()

        expect(results.errors).to.not.be.ok
        expect(results.data?.user?.favoriteStreams?.items).to.have.lengthOf(ids.length)
        expect(results.data.user.favoriteStreams.totalCount).to.equal(ids.length)
        expect(results.data.user.favoriteStreams.cursor).to.be.a('string')
      })

      it('are paginated correctly', async () => {
        let nextCursor = null
        let returnedStreamIds = []

        const getPaginatedAndAssert = async (nextCursor) => {
          const results = await getFavorites(nextCursor, 1)
          expect(results.errors).to.not.be.ok
          expect(results.data?.user?.favoriteStreams).to.be.ok

          return {
            cursor: results.data.user.favoriteStreams.cursor,
            sids: results.data.user.favoriteStreams.items.map((i) => i.id)
          }
        }

        let failsafe = 3
        while (failsafe > 0) {
          let res = await getPaginatedAndAssert(nextCursor)
          returnedStreamIds = returnedStreamIds.concat(res.sids)
          nextCursor = res.cursor

          failsafe--
          if (returnedStreamIds.length < 0) break
        }

        expect(returnedStreamIds).to.deep.equalInAnyOrder(favoritedStreamIds())
      })
    })
  })

  describe('when not authenticated', () => {
    /** @type {import('apollo-server-express').ApolloServer} */
    let apollo

    before(() => {
      apollo = buildApolloServer({
        context: () => ({})
      })
    })

    it("can't be favorited", async () => {
      const result = await apollo.executeOperation({
        query: favoriteMutationGql,
        variables: { sid: myPubStream.id, favorited: true }
      })

      expect(result.data.streamFavorite).to.not.be.ok
      expect(result.errors).to.have.lengthOf(1)
      expect(result.errors.at(0).message).to.contain('must provide an auth token')
    })

    it("can't be retrieved", async () => {
      const result = await apollo.executeOperation({
        query: favoriteStreamsQueryGql
      })

      expect(result.data.user).to.be.null
      expect(result.errors).to.not.be.ok
    })
  })
})
