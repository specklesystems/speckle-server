// Hooking up mailer mock
const { mockRequireModule } = require('@/test/mockHelper')
const mailerMock = mockRequireModule(
  ['@/modules/emails', '@/modules/emails/index'],
  [
    '@/modules/serverinvites/services/inviteCreationService',
    '@/modules/serverinvites/services/inviteProcessingService',
    '@/modules/serverinvites/graph/resolvers/serverInvites'
  ]
)

const crs = require('crypto-random-string')
const { buildApolloServer } = require('@/app')
const { Streams, Users, ServerInvites } = require('@/modules/core/dbSchema')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const { createUser } = require('@/modules/core/services/users')
const { addLoadersToCtx } = require('@/modules/shared')
const {
  createServerInvite,
  createStreamInvite,
  resendInvite,
  batchCreateServerInvites,
  batchCreateStreamInvites,
  deleteInvite,
  getStreamInvite,
  useUpStreamInvite,
  cancelStreamInvite,
  getStreamPendingCollaborators
} = require('@/test/graphql/serverInvites')
const { truncateTables } = require('@/test/hooks')
const { expect } = require('chai')
const {
  createStream,
  grantPermissionsStream
} = require('@/modules/core/services/streams')
const { getInvite: getInviteFromDB } = require('@/modules/serverinvites/repositories')
const { getUserStreamRole } = require('@/test/speckle-helpers/streamHelper')
const { createInviteDirectly } = require('@/test/speckle-helpers/inviteHelper')

async function cleanup() {
  await truncateTables([ServerInvites.name, Streams.name, Users.name])
}

function getInviteIdFromEmailParams(emailParams) {
  const { text } = emailParams
  const [, inviteId] = text.match(/\?inviteId=(.*)\s/i)
  return inviteId
}

async function validateInviteExistanceFromEmail(emailParams) {
  // Validate that invite exists
  const inviteId = getInviteIdFromEmailParams(emailParams)
  expect(inviteId).to.be.ok
  const invite = await getInviteFromDB(inviteId)
  expect(invite).to.be.ok
}

describe('[Stream & Server Invites]', () => {
  const me = {
    name: 'Authenticated server invites guy',
    email: 'serverinvitesguy@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: undefined
  }

  const otherGuy = {
    name: 'Some Other DUde',
    email: 'otherguy111@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: undefined
  }

  const myPrivateStream = {
    name: 'My Private Stream 1',
    isPublic: false,
    id: undefined
  }

  const otherGuysStream = {
    name: 'Other guys stream 1',
    isPublic: false,
    id: undefined
  }

  before(async () => {
    await cleanup()

    // Seeding
    await Promise.all([
      createUser(me).then((id) => (me.id = id)),
      createUser(otherGuy).then((id) => (otherGuy.id = id))
    ])

    await Promise.all([
      createStream({ ...myPrivateStream, ownerId: me.id }).then(
        (id) => (myPrivateStream.id = id)
      ),
      createStream({ ...otherGuysStream, ownerId: otherGuy.id }).then(
        (id) => (otherGuysStream.id = id)
      )
    ])
  })

  after(async () => {
    await cleanup()
  })

  afterEach(async () => {
    mailerMock.disable()
  })

  beforeEach(async () => {
    mailerMock.disable()
  })

  describe('When user authenticated', () => {
    /** @type {import('apollo-server-express').ApolloServer} */
    let apollo

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
    })

    describe('and inviting to server', () => {
      const createInvite = (input) => createServerInvite(apollo, input)

      it("can't invite an already registered user", async () => {
        const { errors, data } = await createInvite({
          email: otherGuy.email,
          message: 'hey dude'
        })

        expect(data?.serverInviteCreate).to.be.not.ok
        expect(errors).to.be.ok
        expect(errors.map((e) => e.message).join('|')).to.contain(
          'email is already associated with an account'
        )
      })

      it('can invite new user', async () => {
        const targetEmail = 'randomguy@random.com'

        const messagePart1 = '1234hiiiiduuuuude'
        const messagePart2 = 'yepppppp'
        const unsanitaryMessage = `<a href="https://google.com">${messagePart1}</a> <script>${messagePart2}</script>`

        let emailParams
        mailerMock.enable()
        mailerMock.mockFunction('sendEmail', (params) => {
          emailParams = params
        })

        const result = await createInvite({
          email: targetEmail,
          message: unsanitaryMessage
        })

        // Check that operation was successful
        expect(result.data?.serverInviteCreate).to.be.ok
        expect(result.errors).to.be.not.ok

        // Check that email was sent out
        expect(emailParams).to.be.ok
        expect(emailParams.to).to.eq(targetEmail)
        expect(emailParams.subject).to.be.ok

        // Check that message was sanitized
        expect(emailParams.text).to.contain(messagePart1)
        expect(emailParams.text).to.not.contain(messagePart2)
        expect(emailParams.html).to.contain(messagePart1)
        expect(emailParams.html).to.not.contain(messagePart2)

        // Validate that invite exists
        await validateInviteExistanceFromEmail(emailParams)
      })

      it("can't invite a user whose email is already registered", async () => {
        const result = await createInvite({
          email: otherGuy.email
        })

        expect(result.data).to.not.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'This email is already associated with an account'
        )
      })

      it("can't generate a message that is too long", async () => {
        const result = await createInvite({
          email: 'aaggaggg@asdasd.com',
          message: crs({ length: 1025 })
        })

        expect(result.data).to.not.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'Personal message too long'
        )
      })
    })

    describe('and inviting to stream', () => {
      const otherGuyAlreadyInvitedStream = {
        name: 'Other guy is already here stream',
        isPublic: false,
        id: undefined
      }

      const createInvite = (input) => createStreamInvite(apollo, input)

      before(async () => {
        // Create a stream and make sure otherGuy is already a contributor there
        await createStream({ ...otherGuyAlreadyInvitedStream, ownerId: me.id }).then(
          (id) => (otherGuyAlreadyInvitedStream.id = id)
        )
        await grantPermissionsStream({
          streamId: otherGuyAlreadyInvitedStream.id,
          role: Roles.Stream.Contributor,
          userId: otherGuy.id
        })
      })

      const alreadyInvitedUserDataSet = [
        { display: 'by user id', userId: true },
        { display: 'by email', userId: false }
      ]

      alreadyInvitedUserDataSet.forEach(({ display, userId }) => {
        it(`can't invite an already added user ${display}`, async () => {
          const { errors, data } = await createInvite({
            email: userId ? null : otherGuy.email,
            userId: userId ? otherGuy.id : null,
            message: 'hey dude come to my stream',
            streamId: otherGuyAlreadyInvitedStream.id
          })

          expect(data?.serverInviteCreate).to.be.not.ok
          expect(errors).to.be.ok
          expect(errors.map((e) => e.message).join('|')).to.contain(
            'user is already a collaborator'
          )
        })
      })

      const userTypesDataSet = [
        {
          display: 'registered',
          user: otherGuy,
          stream: myPrivateStream,
          email: null
        },
        {
          display: 'unregistered',
          user: null,
          stream: myPrivateStream,
          email: 'randomer22@lool.com'
        }
      ]

      userTypesDataSet.forEach(({ display, user, stream, email }) => {
        it(`can invite a ${display} user`, async () => {
          const messagePart1 = '1234hiiiiduuuuude'
          const messagePart2 = 'yepppppp'
          const unsanitaryMessage = `<a href="https://google.com">${messagePart1}</a> <script>${messagePart2}</script>`
          const targetEmail = email || user.email

          let emailParams
          mailerMock.enable()
          mailerMock.mockFunction('sendEmail', (params) => {
            emailParams = params
          })

          const result = await createInvite({
            email,
            message: unsanitaryMessage,
            userId: user?.id || null,
            streamId: stream?.id || null
          })

          // Check that operation was successful
          expect(result.data?.streamInviteCreate).to.be.ok
          expect(result.errors).to.be.not.ok

          // Check that email was sent out
          expect(emailParams).to.be.ok
          expect(emailParams.to).to.eq(targetEmail)
          expect(emailParams.subject).to.be.ok

          // Check that message was sanitized
          expect(emailParams.text).to.contain(messagePart1)
          expect(emailParams.text).to.not.contain(messagePart2)
          expect(emailParams.html).to.contain(messagePart1)
          expect(emailParams.html).to.not.contain(messagePart2)

          // Validate that invite exists
          await validateInviteExistanceFromEmail(emailParams)
        })
      })

      it("can't invite user to a nonexistant stream", async () => {
        const result = await createInvite({
          email: 'whocares@really.com',
          streamId: 'ayoooooooo'
        })

        expect(result.data).to.not.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'not found'
        )
      })

      it("can't invite user to a stream, if not its owner", async () => {
        const result = await createInvite({
          email: 'whocares@really.com',
          streamId: otherGuysStream.id
        })

        expect(result.data).to.not.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'You do not have access to this resource'
        )
      })

      it("can't invite a nonexistant user ID to a stream", async () => {
        const result = await createInvite({
          userId: 'bababooey',
          streamId: myPrivateStream.id
        })

        expect(result.data).to.not.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'Attempting to invite an invalid user'
        )
      })
    })

    describe('and administrating invites', () => {
      const serverInvite1 = {
        message: 'some server invite1',
        email: 'serverinvite1recipient@google.com',
        inviteId: undefined
      }

      const streamInvite1 = {
        message: 'some stream invite1',
        email: 'somestreaminvite1recipient@google.com',
        stream: myPrivateStream,
        inviteId: undefined
      }

      const streamInvite2 = {
        message: 'some stream invite2',
        user: otherGuy,
        stream: myPrivateStream,
        inviteId: undefined
      }

      const invites = [serverInvite1, streamInvite1, streamInvite2]

      before(async () => {
        apollo = buildApolloServer({
          context: () =>
            addLoadersToCtx({
              auth: true,
              userId: me.id,
              role: Roles.Server.Admin, // Marking the user as an admin
              token: 'asd',
              scopes: AllScopes
            })
        })

        // Creating some invites
        await Promise.all(
          invites.map((i) =>
            createInviteDirectly(i, me.id).then((id) => (i.inviteId = id))
          )
        )
      })

      it('they can resend pre-existing invites irregardless of type', async () => {
        const emailParamsArr = []
        mailerMock.enable()
        mailerMock.mockFunction('sendEmail', (params) => {
          emailParamsArr.push(params)
        })

        const inviteIds = invites.map((i) => i.inviteId)

        const results = await Promise.all(
          inviteIds.map((inviteId) => resendInvite(apollo, { inviteId }))
        )

        for (const result of results) {
          expect(result.data?.inviteResend).to.be.ok
          expect(result.errors).to.not.be.ok
        }

        expect(emailParamsArr).to.have.length(inviteIds.length)
      })

      it('they can delete pre-existing invites irregardless of type', async () => {
        // Create a couple of invites and resolve their IDs
        const deletableInvites = [
          {
            message: 'some server invite1',
            email: 'serverinvite1recipient@google.com',
            inviteId: undefined
          },
          {
            message: 'some stream invite1',
            email: 'somestreaminvite1recipient@google.com',
            stream: myPrivateStream,
            inviteId: undefined
          }
        ]
        await Promise.all(
          deletableInvites.map((i) =>
            createInviteDirectly(i, me.id).then((id) => (i.inviteId = id))
          )
        )

        // Delete all invites
        for (const invite of deletableInvites) {
          const result = await deleteInvite(apollo, { inviteId: invite.inviteId })
          expect(result.data?.inviteDelete).to.be.ok
          expect(result.errors).to.not.be.ok
        }

        // Validate that invites no longer exist
        const invitesInDb = await Promise.all(
          deletableInvites.map((i) => getInviteFromDB(i.inviteId))
        )
        expect(invitesInDb.every((i) => !i)).to.be.true
      })

      it('they can batch create server invites', async () => {
        const emails = ['abababa1@mail.com', 'abababa2@mail.com', 'abababa3@mail.com']
        const message = 'ayyoyoyoyoy'

        const emailParamsArr = []
        mailerMock.enable()
        mailerMock.mockFunction('sendEmail', (params) => {
          emailParamsArr.push(params)
        })

        const result = await batchCreateServerInvites(apollo, {
          message,
          emails
        })

        expect(result.data?.serverInviteBatchCreate).to.be.ok
        expect(result.errors).to.not.be.ok

        expect(emailParamsArr).to.have.length(emails.length)
        for (const email of emails) {
          const emailParams = emailParamsArr.find((p) => p.to === email)

          expect(emailParams).to.be.ok
          expect(emailParams.html).to.contain(message)
          expect(emailParams.text).to.contain(message)
          await validateInviteExistanceFromEmail(emailParams)
        }
      })

      it('they can batch create stream invites', async () => {
        /** @type {import('@/test/graphql/serverInvites').StreamInviteCreateInput[]} */
        const inputs = [
          {
            email: 'ayyayyyyyyy@asdasdad.com',
            message: 'yoo bruh',
            streamId: myPrivateStream.id
          },
          {
            email: 'ayyayasdadsasdyy@asdasdad.com',
            message: 'yoo bruh',
            streamId: myPrivateStream.id
          },
          {
            userId: otherGuy.id,
            message: 'waddup',
            streamId: myPrivateStream.id
          }
        ]

        const emailParamsArr = []
        mailerMock.enable()
        mailerMock.mockFunction('sendEmail', (params) => {
          emailParamsArr.push(params)
        })

        const result = await batchCreateStreamInvites(apollo, inputs)

        expect(result.data?.streamInviteBatchCreate).to.be.ok
        expect(result.errors).to.not.be.ok

        expect(emailParamsArr).to.have.length(inputs.length)
        for (const inputData of inputs) {
          const emailParams = emailParamsArr.find((p) =>
            inputData.email ? p.to === inputData.email : p.to === otherGuy.email
          )
          expect(emailParams).to.be.ok
          expect(emailParams.html).to.contain(inputData.message)
          expect(emailParams.text).to.contain(inputData.message)
          await validateInviteExistanceFromEmail(emailParams)
        }
      })
    })

    describe('and they are looking at a stream invite', async () => {
      const inviteFromOtherGuy = {
        message: 'some stream invite3',
        user: me,
        stream: otherGuysStream,
        inviteId: undefined
      }

      beforeEach(async () => {
        // Create an invite before each test so that we can mutate them
        // in each test as needed
        await createInviteDirectly(inviteFromOtherGuy, otherGuy.id).then(
          (id) => (inviteFromOtherGuy.inviteId = id)
        )
      })

      const inviteRetrievalDataset = [
        { display: 'by id', withId: true },
        { display: 'without an invite ID', withId: false }
      ]
      inviteRetrievalDataset.forEach(({ display, withId }) => {
        it(`the invite can be retrieved ${display}`, async () => {
          const result = await getStreamInvite(apollo, {
            streamId: inviteFromOtherGuy.stream.id,
            inviteId: withId ? inviteFromOtherGuy.inviteId : null
          })

          expect(result.data?.streamInvite).to.be.ok
          expect(result.errors).to.not.be.ok

          const data = result.data.streamInvite
          expect(data.inviteId).to.eq(inviteFromOtherGuy.inviteId)
          expect(data.streamId).to.eq(inviteFromOtherGuy.stream.id)
          expect(data.title).to.eq(me.name)

          expect(data.user.id).eq(me.id)
          expect(data.user.name).to.eq(me.name)

          expect(data.invitedBy.id).eq(otherGuy.id)
          expect(data.invitedBy.name).eq(otherGuy.name)
        })
      })

      const useUpDataSet = [
        { display: 'declined', accept: false },
        { display: 'accepted', accept: true }
      ]
      useUpDataSet.forEach(({ display, accept }) => {
        it(`the invite can be ${display}`, async () => {
          const inviteId = inviteFromOtherGuy.inviteId
          const streamId = inviteFromOtherGuy.stream.id

          const { data, errors } = await useUpStreamInvite(apollo, {
            accept,
            inviteId,
            streamId
          })

          expect(data?.streamInviteUse).to.be.ok
          expect(errors).to.not.be.ok
          expect(await getInviteFromDB(inviteId)).to.be.not.ok

          const userStreamRole = await getUserStreamRole(me.id, streamId)
          expect(userStreamRole).to.eq(accept ? Roles.Stream.Contributor : null)
        })
      })
    })

    describe('and they are managing their own stream collaborators', async () => {
      // Streams
      const myPublicStream = {
        name: 'My public stream 1',
        isPublic: true,
        id: undefined
      }

      const otherGuysPublicStream = {
        name: 'Other guys public stream 1',
        isPublic: true,
        id: undefined
      }

      // Invites
      const dynamicInvite = {
        message: 'some stream invite i did3',
        user: otherGuy,
        stream: myPublicStream,
        inviteId: undefined
      }

      const myInvite = {
        message: 'another of my streams',
        user: otherGuy,
        stream: myPublicStream,
        inviteId: undefined
      }

      const otherGuysInvite = {
        message: 'a stream belonging to the other guy',
        user: me,
        stream: otherGuysPublicStream,
        inviteId: undefined
      }

      before(async () => {
        // Create streams
        await Promise.all([
          createStream({ ...myPublicStream, ownerId: me.id }).then(
            (id) => (myPublicStream.id = id)
          ),
          createStream({ ...otherGuysPublicStream, ownerId: otherGuy.id }).then(
            (id) => (otherGuysPublicStream.id = id)
          )
        ])

        // Create a couple of static invites that shouldn't be mutated in tests
        await Promise.all([
          createInviteDirectly(myInvite, me.id).then((id) => (myInvite.inviteId = id)),
          createInviteDirectly(otherGuysInvite, otherGuy.id).then(
            (id) => (otherGuysInvite.inviteId = id)
          )
        ])
      })

      beforeEach(async () => {
        // Create an invite before each test so that we can mutate them
        // in each test as needed
        await createInviteDirectly(dynamicInvite, me.id).then(
          (id) => (dynamicInvite.inviteId = id)
        )
      })

      it('a pending invite can be deleted', async () => {
        const inviteId = dynamicInvite.inviteId

        const { data, errors } = await cancelStreamInvite(apollo, {
          streamId: dynamicInvite.stream.id,
          inviteId
        })

        expect(data?.streamInviteCancel).to.be.ok
        expect(errors).to.be.not.ok
        expect(await getInviteFromDB(inviteId)).to.be.not.ok
      })

      it('own pending collaborators can be retrieved', async () => {
        const streamId = myPublicStream.id
        const { data, errors } = await getStreamPendingCollaborators(apollo, {
          streamId
        })

        expect(errors).to.be.not.ok
        expect(data.stream).to.be.ok
        expect(data.stream.id).to.eq(streamId)
        expect(data.stream.pendingCollaborators || []).to.have.length(1)
        expect(data.stream.pendingCollaborators[0].user?.id).to.eq(otherGuy.id)
      })

      it("a foreign stream's pending collaborators can't be retrieved", async () => {
        const streamId = otherGuysPublicStream.id
        const { data, errors } = await getStreamPendingCollaborators(apollo, {
          streamId
        })

        expect(data.stream).to.be.ok
        expect(data.stream.id).to.eq(streamId)
        expect(data.stream.pendingCollaborators).to.be.not.ok
        expect(errors).to.be.ok
        expect(errors.map((e) => e.message).join('|')).to.contain(
          'You do not have access'
        )
      })
    })
  })
})
