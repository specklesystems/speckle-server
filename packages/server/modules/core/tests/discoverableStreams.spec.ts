import { buildApolloServer } from '@/app'
import { db } from '@/db/knex'
import { Streams, Users } from '@/modules/core/dbSchema'
import {
  getStreamFactory,
  setStreamFavoritedFactory
} from '@/modules/core/repositories/streams'
import { Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  DiscoverableStreamsSortType,
  SortDirection
} from '@/test/graphql/generated/graphql'
import {
  createStream,
  readDiscoverableStreams,
  updateStream
} from '@/test/graphql/streams'
import {
  createAuthedTestContext,
  createTestContext,
  ServerAndContext
} from '@/test/graphqlHelper'
import { truncateTables } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { wait } from '@speckle/shared'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { shuffle } from 'lodash'

const READABLE_DISCOVERABLE_STREAM_COUNT = 15

const cleanup = async () => await truncateTables([Streams.name, Users.name])
const getStream = getStreamFactory({ db })
const setStreamFavorited = setStreamFavoritedFactory({ db })

describe('Discoverable streams', () => {
  let apollo: ServerAndContext

  const me: BasicTestUser = {
    name: 'itsaa meeee',
    email: 'me@gimail.com',
    password: 'whateveridontcare',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'otherr guyyyy1',
    email: 'otherguy1@gimail.com',
    password: 'whateveridontcare',
    id: ''
  }

  const favoriterGuy1: BasicTestUser = {
    name: 'favoriter guy1',
    email: 'favoriterguy1@gimail.com',
    password: 'whateveridontcare',
    id: ''
  }

  const favoriterGuy2: BasicTestUser = {
    name: 'favoriter guy2',
    email: 'favoriterguy2@gimail.com',
    password: 'whateveridontcare',
    id: ''
  }

  const favoriterGuy3: BasicTestUser = {
    name: 'favoriter guy3',
    email: 'favoriterguy3@gimail.com',
    password: 'whateveridontcare',
    id: ''
  }

  const allUsers = [me, otherGuy, favoriterGuy1, favoriterGuy2, favoriterGuy3]

  const readableDiscoverableStreams: BasicTestStream[] = []

  before(async () => {
    await cleanup()

    // Seeding users
    await createTestUsers(allUsers)

    // Seeding streams (sequentially to ensure different created dates)
    for (let i = 0; i < READABLE_DISCOVERABLE_STREAM_COUNT; i++) {
      const owner = i % 2 === 0 ? me : otherGuy
      const newStream: BasicTestStream = {
        name: 'Readable Discoverable Stream ' + i,
        isPublic: true,
        isDiscoverable: true,
        id: '',
        ownerId: ''
      }
      readableDiscoverableStreams.push(newStream)
      await createTestStream(newStream, owner)
      await wait(5)
    }

    // Favoriting some of them - stream with 5 favorites, stream with 4 favorites, then 3 and so on...
    const favoriters = shuffle(allUsers.slice())
    const favoritableStreams = shuffle(readableDiscoverableStreams.slice())

    for (let i = favoriters.length; i > 0; i--) {
      const currentFavoriters = favoriters.slice(0, i)
      const currentStream = favoritableStreams.pop()

      while (currentStream && currentFavoriters.length > 0) {
        const favoriter = currentFavoriters.pop()
        if (!favoriter) break

        await setStreamFavorited({
          streamId: currentStream.id,
          userId: favoriter.id,
          favorited: true
        })
        await wait(5)
      }
    }

    apollo = {
      apollo: await buildApolloServer(),
      context: await createTestContext()
    }
  })

  after(async () => {
    await cleanup()
  })

  it('can be retrieved', async () => {
    const { data, errors } = await readDiscoverableStreams(apollo, {
      limit: READABLE_DISCOVERABLE_STREAM_COUNT
    })

    expect(errors).to.be.not.ok
    expect(data?.discoverableStreams).to.be.ok
    expect(data?.discoverableStreams?.totalCount).to.eq(
      READABLE_DISCOVERABLE_STREAM_COUNT
    )
    expect(data?.discoverableStreams?.items?.length).to.eq(
      READABLE_DISCOVERABLE_STREAM_COUNT
    )
    expect(data?.discoverableStreams?.cursor).to.be.ok

    const someItem = data?.discoverableStreams?.items?.[0]
    expect(someItem?.id).to.be.ok
    expect(someItem?.isDiscoverable).to.be.ok
  })

  const sortTypeDataset = [
    { display: 'created date', sortType: DiscoverableStreamsSortType.CreatedDate },
    { display: 'favorites count', sortType: DiscoverableStreamsSortType.FavoritesCount }
  ]
  const sortDirectionDataset = [
    { display: 'ascending', sortDir: SortDirection.Asc },
    { display: 'descending', sortDir: SortDirection.Desc }
  ]

  sortTypeDataset.forEach(({ display: sortTypeDisplay, sortType }) => {
    sortDirectionDataset.forEach(({ display: sortDirDisplay, sortDir }) => {
      it(`can be retrieved properly paginated & sorted by ${sortDirDisplay} ${sortTypeDisplay}`, async () => {
        const limit = Math.max(Math.floor(READABLE_DISCOVERABLE_STREAM_COUNT / 3), 1)

        const collectedItems = []
        let currentSortByValue: Optional<number | string> = undefined
        let cursor: Nullable<string> = null

        const retrieveAndTestPage = async (cursor: Nullable<string>) => {
          const { data, errors } = await readDiscoverableStreams(apollo, {
            limit,
            cursor,
            sort: {
              type: sortType,
              direction: sortDir
            }
          })

          expect(errors).to.be.not.ok
          expect(data?.discoverableStreams?.totalCount).to.eq(
            READABLE_DISCOVERABLE_STREAM_COUNT
          )

          const items = data?.discoverableStreams?.items || []
          const hasMorePages = items.length === limit
          const newCursor = data?.discoverableStreams?.cursor

          for (const currentItem of items) {
            collectedItems.push(currentItem)

            let sortByValue: string | number
            if (sortType === DiscoverableStreamsSortType.CreatedDate) {
              sortByValue = currentItem.createdAt
            } else if (sortType === DiscoverableStreamsSortType.FavoritesCount) {
              sortByValue = currentItem.favoritesCount
            } else {
              throw new Error('Unexpected sort type')
            }

            if (!currentSortByValue) {
              currentSortByValue = sortByValue
              continue
            }

            const previousValue = currentSortByValue
            const currentValue = sortByValue
            if (sortType === DiscoverableStreamsSortType.CreatedDate) {
              if (sortDir === SortDirection.Asc) {
                expect(dayjs(currentValue).isAfter(dayjs(previousValue))).to.be.true
              } else {
                expect(dayjs(previousValue).isAfter(dayjs(currentValue))).to.be.true
              }
            } else if (sortType === DiscoverableStreamsSortType.FavoritesCount) {
              if (sortDir === SortDirection.Asc) {
                expect(currentValue).is.greaterThanOrEqual(previousValue as number)
              } else {
                expect(previousValue).is.greaterThanOrEqual(currentValue as number)
              }
            } else {
              throw new Error('Unexpected sort type')
            }
          }

          return { hasMorePages, newCursor }
        }

        let failsafe = 10
        while (failsafe > 0) {
          const testResult = await retrieveAndTestPage(cursor)
          cursor = testResult.newCursor as Nullable<string>

          if (!testResult.hasMorePages) break
          failsafe--
        }

        if (failsafe <= 0)
          throw new Error(
            'Pagination failsafe triggered! Possible infinite loop encountered.'
          )

        expect(collectedItems.length).to.eq(READABLE_DISCOVERABLE_STREAM_COUNT)
      })
    })
  })

  describe('when authenticated', () => {
    let apollo: ServerAndContext

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }
    })

    it('can be retrieved with role properly filled out', async () => {
      const { data, errors } = await readDiscoverableStreams(apollo, {
        limit: READABLE_DISCOVERABLE_STREAM_COUNT
      })

      expect(errors).to.be.not.ok
      expect(data?.discoverableStreams?.totalCount).to.eq(
        READABLE_DISCOVERABLE_STREAM_COUNT
      )

      const items = data?.discoverableStreams?.items || []
      const someHaveRole = items.some((i) => !!i.role)
      expect(someHaveRole).to.be.true
    })

    it('can be created', async () => {
      const { errors, data } = await createStream(apollo, {
        stream: {
          name: 'some rando stream',
          isPublic: true,
          isDiscoverable: true
        }
      })

      expect(errors).to.not.be.ok
      expect(data).to.be.ok
      expect(data?.streamCreate).to.be.ok

      const streamId = data?.streamCreate as string
      const streamData = await getStream({ streamId })

      expect(streamData).to.be.ok
      expect(streamData?.isDiscoverable).to.be.true
      expect(streamData?.isPublic).to.be.true
    })

    const cantMakeDiscoverableDataset = [
      { display: 'isDiscoverable set to false', isDiscoverable: false, isPublic: true },
      { display: 'isPublic is set to false', isDiscoverable: true, isPublic: false }
    ]
    cantMakeDiscoverableDataset.forEach(({ display, isDiscoverable, isPublic }) => {
      it(`cant be created discoverable if ${display}`, async () => {
        const { errors, data } = await createStream(apollo, {
          stream: {
            isPublic,
            isDiscoverable
          }
        })

        expect(errors).to.not.be.ok
        expect(data).to.be.ok
        expect(data?.streamCreate).to.be.ok

        const streamId = data?.streamCreate as string
        const streamData = await getStream({ streamId })

        expect(streamData).to.be.ok
        expect(streamData?.isDiscoverable).to.be.false
        expect(streamData?.isPublic).to.eq(isPublic)
      })
    })

    describe('and being updated', () => {
      const updateableStream: BasicTestStream = {
        name: 'ill be getting updated a lot',
        isPublic: false,
        isDiscoverable: false,
        id: '',
        ownerId: ''
      }

      beforeEach(async () => {
        // re-create for each test
        await createTestStream(updateableStream, me)
      })

      it('can be updated to be discoverable or not', async () => {
        const testWithDiscoverable = async (val: boolean) => {
          const { errors, data } = await updateStream(apollo, {
            stream: {
              id: updateableStream.id,
              isPublic: val,
              isDiscoverable: val
            }
          })

          expect(errors).to.not.be.ok
          expect(data).to.be.ok
          expect(data?.streamUpdate).to.be.ok

          const streamData = await getStream({ streamId: updateableStream.id })

          expect(streamData).to.be.ok
          expect(streamData?.isDiscoverable).to.eq(val)
          expect(streamData?.isPublic).to.eq(val)
        }

        // Toggle on
        await testWithDiscoverable(true)

        // Toggle off
        await testWithDiscoverable(false)
      })

      cantMakeDiscoverableDataset.forEach(({ display, isDiscoverable, isPublic }) => {
        it(`cant be updated to be discoverable if ${display}`, async () => {
          const { errors, data } = await updateStream(apollo, {
            stream: {
              id: updateableStream.id,
              isPublic,
              isDiscoverable
            }
          })

          expect(errors).to.not.be.ok
          expect(data).to.be.ok
          expect(data?.streamUpdate).to.be.ok

          const streamData = await getStream({ streamId: updateableStream.id })

          expect(streamData).to.be.ok
          expect(streamData?.isDiscoverable).to.be.false
          expect(streamData?.isPublic).to.eq(isPublic)
        })
      })
    })
  })
})
