import { ServerInvites, Streams, Users } from '@/modules/core/dbSchema'
import { truncateTables } from '@/test/hooks'
import { times, clamp } from 'lodash'
import { createStreamInviteDirectly } from '@/test/speckle-helpers/inviteHelper'
import { getAdminUsersList } from '@/test/graphql/users'
import { buildApolloServer } from '@/app'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { expect } from 'chai'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { wait } from '@speckle/shared'
import { createAuthedTestContext, ServerAndContext } from '@/test/graphqlHelper'
import {
  createStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteServerOnlyInvitesFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import {
  countAdminUsersFactory,
  getUserFactory,
  getUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

// To ensure that the invites are created in the correct order, we need to wait a bit between each creation
const WAIT_TIMEOUT = 5

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
const createInviteDirectly = createStreamInviteDirectly

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

function randomEl<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function cleanup() {
  await truncateTables([ServerInvites.name, Streams.name, Users.name])
}

async function getOrderedInviteIds() {
  // Only returning invites that can appear on the admin users list
  return (
    await ServerInvites.knex()
      .select<{ id: string }[]>(ServerInvites.col.id)
      .where(ServerInvites.col.target, 'NOT ILIKE', `@%`)
  ).map((o) => o.id)
}

async function getOrderedUserIds() {
  return (await Users.knex().select<{ id: string }[]>(Users.col.id)).map((o) => o.id)
}

describe('[Admin users list]', () => {
  const me = {
    name: 'Mr Server Admin Dude',
    email: 'adminuserguy@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: undefined as Optional<string>,
    verified: false
  }

  const USER_COUNT = 15
  const SERVER_INVITE_COUNT = 5
  const STREAM_INVITE_COUNT = 5

  const SEARCH_QUERY_RESULT_COUNT = 4
  const SEARCH_QUERY = 'abcd12345'

  const PAGE_ITEM_COUNT = 3

  const totalCount = USER_COUNT + SERVER_INVITE_COUNT + STREAM_INVITE_COUNT
  const totalInviteCount = SERVER_INVITE_COUNT + STREAM_INVITE_COUNT

  let apollo: ServerAndContext
  let orderedUserIds: string[] = []
  let orderedInviteIds: string[] = []

  before(async () => {
    if (SEARCH_QUERY_RESULT_COUNT >= totalInviteCount)
      throw new Error(
        'Search query result count should be way smaller than the total invite count'
      )

    if (SEARCH_QUERY_RESULT_COUNT >= USER_COUNT)
      throw new Error(
        'Search query result count should be way smaller than the total user count'
      )

    if (PAGE_ITEM_COUNT >= totalCount)
      throw new Error(
        'Page item count should be bigger than the total count to properly test everything'
      )

    if (PAGE_ITEM_COUNT >= SEARCH_QUERY_RESULT_COUNT)
      throw new Error(
        'Page item count should be bigger than the search query containing invite/user count to properly test everything'
      )

    await cleanup()

    await createUser(me).then((id) => (me.id = id))

    const userIds: string[] = []
    let remainingSearchQueryUserCount = SEARCH_QUERY_RESULT_COUNT
    let remainingSearchQueryInviteCount = SEARCH_QUERY_RESULT_COUNT

    // Create Users
    // count - 1, cause `me` also exists
    for (let i = 0; i < USER_COUNT - 1; i++) {
      const id = await createUser({
        name: `User #${i} - ${
          remainingSearchQueryUserCount-- >= 1 ? SEARCH_QUERY : ''
        }`,
        email: `speckleuser${i}@gmail.com`,
        password: 'sn3aky-1337-b1m',
        verified: false
      })
      userIds.push(id)
      await wait(WAIT_TIMEOUT)
    }

    // Create streams
    const streamData: { id: string; ownerId: string }[] = []
    await Promise.all(
      times(STREAM_INVITE_COUNT, (i) => {
        const ownerId = randomEl(userIds)
        return createStream({
          name: `Some stream #${i}`,
          isPublic: i % 2 === 0,
          ownerId
        }).then((id) => streamData.push({ id, ownerId }))
      })
    )

    // Create invites
    // Server invites
    for (let i = 0; i < SERVER_INVITE_COUNT; i++) {
      await createInviteDirectly(
        {
          email: `randominvitee${i}.${
            remainingSearchQueryInviteCount-- >= 1 ? SEARCH_QUERY : ''
          }@gmail.com`
        },
        randomEl(userIds)
      )
      await wait(WAIT_TIMEOUT)
    }

    // Stream invites
    for (let i = 0; i < STREAM_INVITE_COUNT; i++) {
      const { id: streamId, ownerId } = randomEl(streamData)
      const email = `streamrandominvitee${i}.${
        remainingSearchQueryInviteCount-- >= 1 ? SEARCH_QUERY : ''
      }@gmail.com`

      await createInviteDirectly(
        {
          streamId,
          email
        },
        ownerId
      )
      await wait(WAIT_TIMEOUT)
    }

    // Create a few more stream invites to registered users, which should not appear in
    // the users list
    // (doing these sequentially, otherwise operations can interfere with each other, cause of the target being chosen randomly)
    const createdInvitesData = <Array<{ inviteId: string; token: string }>>[]
    for (let i = 0; i < 3; i++) {
      const { id: streamId, ownerId } = randomEl(streamData)
      const userId = randomEl(userIds.filter((i) => i !== ownerId))

      createdInvitesData.push(
        await createInviteDirectly(
          {
            streamId,
            userId
          },
          ownerId
        )
      )
    }

    if (!createdInvitesData.every(({ inviteId, token }) => inviteId && token))
      throw new Error('Stream invite generation failed')

    // Resolve ordered ids
    orderedInviteIds = await getOrderedInviteIds()
    orderedUserIds = await getOrderedUserIds()

    apollo = {
      apollo: await buildApolloServer(),
      context: await createAuthedTestContext(me.id!, { role: Roles.Server.Admin })
    }
  })

  after(async () => {
    await cleanup()
  })

  it('All users and invites are paginated & returned correctly and in correct order', async () => {
    const totalPageCount = Math.ceil(totalCount / PAGE_ITEM_COUNT)
    const inviteIds = [...orderedInviteIds]
    const userIds = [...orderedUserIds]

    for (let page = 0; page < totalPageCount; page++) {
      const offset = page * PAGE_ITEM_COUNT

      const expectedItemCount = clamp(totalCount - offset, 0, PAGE_ITEM_COUNT)
      const expectedInviteCount = clamp(totalInviteCount - offset, 0, expectedItemCount)
      const expectedUserCount = clamp(
        PAGE_ITEM_COUNT - expectedInviteCount,
        0,
        expectedItemCount
      )

      const { data, errors } = await getAdminUsersList(apollo, {
        limit: PAGE_ITEM_COUNT,
        offset
      })

      expect(errors).to.be.not.ok
      expect(data?.adminUsers).to.be.ok

      expect(data?.adminUsers?.totalCount).to.eq(totalCount)
      expect(data?.adminUsers?.items).to.have.length(expectedItemCount)

      const items = [...(data?.adminUsers?.items || [])]

      // Should always start with invites first
      const inviteItems = items.splice(0, expectedInviteCount)
      for (const inviteItem of inviteItems) {
        const expectedInviteId = inviteIds.shift()

        expect(inviteItem.invitedUser).to.be.ok
        expect(inviteItem.registeredUser).to.be.not.ok

        expect(inviteItem.invitedUser?.email).to.contain('randominvitee')
        expect(inviteItem.invitedUser?.invitedBy.name).to.contain('User #')
        expect(inviteItem.invitedUser?.id).to.eq(expectedInviteId)
      }

      // And users only afterwards
      const userItems = items.splice(0, expectedUserCount)
      for (const userItem of userItems) {
        const expectedUserId = userIds.shift()

        expect(userItem.invitedUser).to.be.not.ok
        expect(userItem.registeredUser).to.be.ok
        expect(userItem.registeredUser?.id).to.eq(expectedUserId)

        if (userItem.registeredUser?.id !== me.id) {
          expect(userItem.registeredUser?.name).to.contain('User #')
          expect(userItem.registeredUser?.email).to.contain('speckleuser')
        }
      }

      expect(items).to.be.empty
    }

    expect(inviteIds).to.be.empty
    expect(userIds).to.be.empty
  })

  it('Filtered users and invites are paginated & returned correctly and in correct order', async () => {
    const totalCount = SEARCH_QUERY_RESULT_COUNT * 2
    const totalInviteCount = SEARCH_QUERY_RESULT_COUNT
    const totalPageCount = Math.ceil(totalCount / PAGE_ITEM_COUNT)

    const inviteIds = [...orderedInviteIds]
    const userIds = [...orderedUserIds]

    for (let page = 0; page < totalPageCount; page++) {
      const offset = page * PAGE_ITEM_COUNT
      const expectedItemCount = clamp(totalCount - offset, 0, PAGE_ITEM_COUNT)
      const expectedInviteCount = clamp(totalInviteCount - offset, 0, expectedItemCount)
      const expectedUserCount = clamp(
        PAGE_ITEM_COUNT - expectedInviteCount,
        0,
        expectedItemCount
      )

      const { data, errors } = await getAdminUsersList(apollo, {
        limit: PAGE_ITEM_COUNT,
        offset,
        query: SEARCH_QUERY
      })

      expect(data?.adminUsers).to.be.ok
      expect(errors).to.be.not.ok

      expect(data?.adminUsers?.totalCount).to.eq(totalCount)
      expect(data?.adminUsers?.items).to.have.length(expectedItemCount)

      const items = [...(data?.adminUsers?.items || [])]

      // Should always start with invites first
      const inviteItems = items.splice(0, expectedInviteCount)
      for (const inviteItem of inviteItems) {
        expect(inviteItem.invitedUser).to.be.ok
        expect(inviteItem.registeredUser).to.be.not.ok
        expect(inviteItem.invitedUser?.email).to.contain(SEARCH_QUERY)

        // Make sure invite IDs follow the correct order
        let correctlyOrderedInviteId = false
        while (inviteIds.length > 0) {
          const candidateInviteId = inviteIds.shift()
          if (candidateInviteId === inviteItem.invitedUser?.id) {
            correctlyOrderedInviteId = true
            break
          }
        }

        expect(correctlyOrderedInviteId).to.be.true
      }

      // And users only afterwards
      const userItems = items.splice(0, expectedUserCount)
      for (const userItem of userItems) {
        expect(userItem.invitedUser).to.be.not.ok
        expect(userItem.registeredUser).to.be.ok

        // Make sure invite IDs follow the correct order
        let correctlyOrderedUserId = false
        while (inviteIds.length > 0) {
          const candidateUserId = userIds.shift()
          if (candidateUserId === userItem.registeredUser?.id) {
            correctlyOrderedUserId = true
            break
          }
        }

        expect(correctlyOrderedUserId).to.be.true
      }

      expect(items).to.be.empty
    }
  })
})
