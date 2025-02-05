import crs from 'crypto-random-string'
import { Streams, Users, ServerInvites } from '@/modules/core/dbSchema'
import { Roles, AllScopes } from '@/modules/core/helpers/mainConstants'
import { truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import {
  BasicTestStream,
  createTestStream,
  createTestStreams,
  getUserStreamRole
} from '@/test/speckle-helpers/streamHelper'
import {
  createStreamInviteDirectly,
  validateInviteExistanceFromEmail
} from '@/test/speckle-helpers/inviteHelper'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import db from '@/db/knex'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import {
  BatchCreateServerInviteDocument,
  BatchCreateStreamInviteDocument,
  CancelStreamInviteDocument,
  CreateProjectInviteDocument,
  CreateProjectInviteMutationVariables,
  CreateServerInviteDocument,
  CreateStreamInviteDocument,
  DeleteInviteDocument,
  GetOwnProjectInvitesDocument,
  GetStreamInviteDocument,
  GetStreamInvitesDocument,
  GetStreamPendingCollaboratorsDocument,
  ResendInviteDocument,
  ServerInviteCreateInput,
  StreamInviteCreateInput,
  UseStreamInviteDocument
} from '@/test/graphql/generated/graphql'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import { reduce } from 'lodash'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'

async function cleanup() {
  await truncateTables([ServerInvites.name, Streams.name, Users.name])
}

const findInvite = findInviteFactory({ db })
const createInviteDirectly = createStreamInviteDirectly
const grantStreamPermissions = grantStreamPermissionsFactory({ db })

const mailerMock = EmailSendingServiceMock

describe('[Stream & Server Invites]', () => {
  const me: BasicTestUser = {
    name: 'Authenticated server invites guy',
    email: 'serverinvitesguy@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'Some Other DUde',
    email: 'otherguy111@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const myPrivateStream: BasicTestStream = {
    name: 'My Private Stream 1',
    isPublic: false,
    id: '',
    ownerId: ''
  }

  const otherGuysStream: BasicTestStream = {
    name: 'Other guys stream 1',
    isPublic: false,
    id: '',
    ownerId: ''
  }

  before(async () => {
    await cleanup()

    // Seeding
    await Promise.all([createTestUser(me), createTestUser(otherGuy)])

    await createTestStreams([
      [myPrivateStream, me],
      [otherGuysStream, otherGuy]
    ])
  })

  after(async () => {
    await cleanup()
  })

  afterEach(() => {
    mailerMock.resetMockedFunctions()
  })

  describe('When user authenticated', () => {
    let apollo: TestApolloServer

    before(async () => {
      apollo = await testApolloServer({ authUserId: me.id })
    })

    describe('and inviting to server', () => {
      const createInvite = (input: ServerInviteCreateInput) => {
        return apollo.execute(CreateServerInviteDocument, { input })
      }

      it("can't invite an already registered user", async () => {
        const { errors, data } = await createInvite({
          email: otherGuy.email,
          message: 'hey dude'
        })

        expect(data?.serverInviteCreate).to.be.not.ok
        expect(errors).to.be.ok
        expect(errors!.map((e) => e.message).join('|')).to.contain(
          'email is already associated with an account'
        )
      })

      it('can invite new user', async () => {
        const targetEmail = 'randomguy@random.com'

        const messagePart1 = '1234hiiiiduuuuude'
        const messagePart2 = 'yepppppp'
        const unsanitaryMessage = `<a href="https://google.com">${messagePart1}</a> <script>${messagePart2}</script>`

        const sendEmailInvocations = mailerMock.hijackFunction(
          'sendEmail',
          async () => true
        )

        const result = await createInvite({
          email: targetEmail,
          message: unsanitaryMessage
        })

        // Check that operation was successful
        expect(result.errors).to.be.not.ok
        expect(result.data?.serverInviteCreate).to.be.ok

        // Check that email was sent out
        expect(sendEmailInvocations.args).to.have.lengthOf(1)
        const emailParams = sendEmailInvocations.args[0][0]
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
      const otherGuyAlreadyInvitedStream: BasicTestStream = {
        name: 'Other guy is already here stream',
        isPublic: false,
        id: '',
        ownerId: ''
      }

      const createInvite = (input: StreamInviteCreateInput) =>
        apollo.execute(CreateStreamInviteDocument, { input })

      const createProjectInvite = (args: CreateProjectInviteMutationVariables) =>
        apollo.execute(CreateProjectInviteDocument, args)

      before(async () => {
        // Create a stream and make sure otherGuy is already a contributor there
        await createTestStream(otherGuyAlreadyInvitedStream, me)
        await grantStreamPermissions({
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

          expect(data?.streamInviteCreate).to.be.not.ok
          expect(errors).to.be.ok
          expect(errors!.map((e) => e.message).join('|')).to.contain(
            'user is already a collaborator'
          )
        })
      })

      it("can't invite with an invalid role", async () => {
        const result = await createInvite({
          email: 'badroleguy@speckle.com',
          streamId: myPrivateStream.id,
          role: 'aaa'
        })

        expect(result.data?.streamInviteCreate).to.be.not.ok
        expect(result.errors).to.be.ok
        expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
          'Unexpected project invite role'
        )
      })

      const createInviteTypes = [{ projectInvite: false }, { projectInvite: true }]

      createInviteTypes.forEach(({ projectInvite }) => {
        const userTypesDataSet = [
          {
            display: 'registered user',
            user: otherGuy,
            stream: myPrivateStream,
            email: null
          },
          {
            display: 'registered user (with custom role)',
            user: otherGuy,
            stream: myPrivateStream,
            email: null,
            role: Roles.Stream.Owner
          },
          {
            display: 'unregistered user',
            user: null,
            stream: myPrivateStream,
            email: 'randomer22@lool.com'
          },
          {
            display: 'unregistered user (with custom role)',
            user: null,
            stream: myPrivateStream,
            email: 'randomer22@lool.com',
            Role: Roles.Stream.Reviewer
          }
        ]

        userTypesDataSet.forEach(({ display, user, stream, email, role }) => {
          it(`can ${
            projectInvite ? 'project' : 'stream'
          } invite a ${display}`, async () => {
            const messagePart1 = '1234hiiiiduuuuude'
            const messagePart2 = 'yepppppp'
            const unsanitaryMessage = `<a href="https://google.com">${messagePart1}</a> <script>${messagePart2}</script>`
            const targetEmail = email || user?.email

            const sendEmailInvocations = mailerMock.hijackFunction(
              'sendEmail',
              async () => true
            )

            if (projectInvite) {
              const result = await createProjectInvite({
                projectId: stream.id,
                input: {
                  email,
                  userId: user?.id || null,
                  role: role || null
                }
              })

              // Check that operation was successful
              expect(result.data?.projectMutations.invites.create).to.be.ok
              expect(result.errors).to.be.not.ok
            } else {
              const result = await createInvite({
                email,
                message: unsanitaryMessage,
                userId: user?.id || null,
                streamId: stream.id,
                role: role || null
              })

              // Check that operation was successful
              expect(result.data?.streamInviteCreate).to.be.ok
              expect(result.errors).to.be.not.ok
            }

            // Check that email was sent out
            const emailParams = sendEmailInvocations.args[0][0]
            expect(emailParams).to.be.ok
            expect(emailParams.to).to.eq(targetEmail)
            expect(emailParams.subject).to.be.ok

            // Check that message was sanitized
            if (!projectInvite) {
              expect(emailParams.text).to.contain(messagePart1)
              expect(emailParams.text).to.not.contain(messagePart2)
              expect(emailParams.html).to.contain(messagePart1)
              expect(emailParams.html).to.not.contain(messagePart2)
            }

            // Validate that invite exists
            const invite = await validateInviteExistanceFromEmail(emailParams)
            expect(invite).to.be.ok
            expect(invite?.resource.role).to.eq(role || Roles.Stream.Contributor)
          })
        })

        it(`can't ${
          projectInvite ? 'project' : 'stream'
        } invite user to a nonexistant stream`, async () => {
          const params = {
            email: 'whocares@really.com',
            streamId: 'ayoooooooo'
          }

          const result = projectInvite
            ? await createProjectInvite({
                projectId: params.streamId,
                input: {
                  email: params.email
                }
              })
            : await createInvite({
                email: params.email,
                streamId: params.streamId
              })

          expect(result.data).to.not.be.ok
          expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
            'not found'
          )
        })

        it(`can't ${
          projectInvite ? 'project' : 'stream'
        } invite user w/ broken stream identifier`, async () => {
          const params = {
            email: 'whocares@really.com',
            streamId: ''
          }

          const result = projectInvite
            ? await createProjectInvite({
                projectId: params.streamId,
                input: {
                  email: params.email
                }
              })
            : await createInvite({
                email: params.email,
                streamId: params.streamId
              })

          expect(result.data).to.not.be.ok
          expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
            'Invalid project ID'
          )
        })

        it(`can't ${
          projectInvite ? 'project' : 'stream'
        } invite user to a stream, if not its owner`, async () => {
          const params = {
            email: 'whocares@really.com',
            streamId: otherGuysStream.id
          }

          const result = projectInvite
            ? await createProjectInvite({
                projectId: params.streamId,
                input: {
                  email: params.email
                }
              })
            : await createInvite({
                email: params.email,
                streamId: params.streamId
              })

          expect(result.data).to.not.be.ok
          expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
            'You are not authorized to access this resource'
          )
        })

        it(`can't ${
          projectInvite ? 'project' : 'stream'
        } invite a nonexistant user ID to a stream`, async () => {
          const params = {
            userId: 'bababooey',
            streamId: myPrivateStream.id
          }

          const result = projectInvite
            ? await createProjectInvite({
                projectId: params.streamId,
                input: {
                  userId: params.userId
                }
              })
            : await createInvite({
                userId: params.userId,
                streamId: params.streamId
              })

          expect(result.data).to.not.be.ok
          expect((result.errors || []).map((e) => e.message).join('|')).to.contain(
            'Attempting to invite an invalid user'
          )
        })
      })
    })

    describe('and administrating invites', () => {
      const serverInvite1 = {
        message: 'some server invite1',
        email: 'serverinvite1recipient@google.com',
        inviteId: '',
        token: ''
      }

      const streamInvite1 = {
        message: 'some stream invite1',
        email: 'somestreaminvite1recipient@google.com',
        stream: myPrivateStream,
        inviteId: '',
        token: ''
      }

      const streamInvite2 = {
        message: 'some stream invite2',
        user: otherGuy,
        stream: myPrivateStream,
        inviteId: '',
        token: ''
      }

      const invites = [serverInvite1, streamInvite1, streamInvite2]

      before(async () => {
        apollo = await testApolloServer({
          context: await createTestContext({
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
            createInviteDirectly(i, me.id).then((o) => {
              i.inviteId = o.inviteId
              i.token = o.token
            })
          )
        )
      })

      it('they can resend pre-existing invites irregardless of type', async () => {
        const sendEmailInvocations = mailerMock.hijackFunction(
          'sendEmail',
          async () => true,
          { times: invites.length }
        )

        const inviteIds = invites.map((i) => i.inviteId)
        const inviteLastRemindedDates = reduce(
          await ServerInvites.knex<ServerInviteRecord[]>().whereIn(
            ServerInvites.col.id,
            inviteIds
          ),
          (res, item) => {
            res[item.id] = item.updatedAt
            return res
          },
          {} as Record<string, Date>
        )

        const results = await Promise.all(
          inviteIds.map((inviteId) =>
            apollo.execute(ResendInviteDocument, { inviteId })
          )
        )

        for (const result of results) {
          expect(result.data?.inviteResend).to.be.ok
          expect(result.errors).to.not.be.ok
        }

        expect(sendEmailInvocations.length()).to.eq(inviteIds.length)

        const newInviteLastRemindedDates = reduce(
          await ServerInvites.knex<ServerInviteRecord[]>().whereIn(
            ServerInvites.col.id,
            inviteIds
          ),
          (res, item) => {
            res[item.id] = item.updatedAt
            return res
          },
          {} as Record<string, Date>
        )

        for (const [id, newDate] of Object.entries(newInviteLastRemindedDates)) {
          expect(newDate).to.be.greaterThan(inviteLastRemindedDates[id])
        }
      })

      it('they can delete pre-existing invites irregardless of type', async () => {
        // Create a couple of invites and resolve their IDs
        const deletableInvites = [
          {
            message: 'some server invite1',
            email: 'serverinvite1recipient@google.com',
            inviteId: '',
            token: ''
          },
          {
            message: 'some stream invite1',
            email: 'somestreaminvite1recipient@google.com',
            stream: myPrivateStream,
            inviteId: '',
            token: ''
          }
        ]

        await Promise.all(
          deletableInvites.map((i) =>
            createInviteDirectly(i, me.id).then((o) => {
              i.inviteId = o.inviteId
              i.token = o.token
            })
          )
        )

        // Delete all invites
        for (const invite of deletableInvites) {
          const result = await apollo.execute(DeleteInviteDocument, {
            inviteId: invite.inviteId
          })
          expect(result.data?.inviteDelete).to.be.ok
          expect(result.errors).to.not.be.ok
        }

        // Validate that invites no longer exist
        const invitesInDb = await Promise.all(
          deletableInvites.map((i) => findInvite({ inviteId: i.inviteId }))
        )
        expect(invitesInDb.every((i) => !i)).to.be.true
      })

      it('they can batch create server invites', async () => {
        const emails = ['abababa1@mail.com', 'abababa2@mail.com', 'abababa3@mail.com']
        const message = 'ayyoyoyoyoy'

        const sendEmailInvocations = mailerMock.hijackFunction(
          'sendEmail',
          async () => true,
          { times: emails.length }
        )

        const result = await apollo.execute(BatchCreateServerInviteDocument, {
          input: emails.map((email) => ({
            message,
            email
          }))
        })

        expect(result.errors).to.not.be.ok
        expect(result.data?.serverInviteBatchCreate).to.be.ok

        expect(sendEmailInvocations.length()).to.eq(emails.length)
        for (const email of emails) {
          const emailParams = sendEmailInvocations.args.find(
            ([p]) => p.to === email
          )?.[0]

          expect(emailParams).to.be.ok
          expect(emailParams!.html).to.contain(message)
          expect(emailParams!.text).to.contain(message)
          await validateInviteExistanceFromEmail(emailParams!)
        }
      })

      it('they can batch create stream invites', async () => {
        const inputs: StreamInviteCreateInput[] = [
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
          },
          {
            email: 'someroleguy@asdasdad.com',
            message: 'yoo bruh',
            streamId: myPrivateStream.id,
            role: Roles.Stream.Reviewer
          }
        ]

        const sendEmailInvocations = mailerMock.hijackFunction(
          'sendEmail',
          async () => false,
          { times: inputs.length }
        )

        const result = await apollo.execute(BatchCreateStreamInviteDocument, {
          input: inputs
        })

        expect(result.data?.streamInviteBatchCreate).to.be.ok
        expect(result.errors).to.not.be.ok

        expect(sendEmailInvocations.length()).to.eq(inputs.length)
        for (const inputData of inputs) {
          const emailParams = sendEmailInvocations.args.find(([p]) =>
            inputData.email ? p.to === inputData.email : p.to === otherGuy.email
          )?.[0]
          expect(emailParams).to.be.ok
          expect(emailParams!.html).to.contain(inputData.message)
          expect(emailParams!.text).to.contain(inputData.message)

          const invite = await validateInviteExistanceFromEmail(emailParams!)
          expect(invite).to.be.ok
          expect(invite?.resource.role).to.eq(
            inputData.role || Roles.Stream.Contributor
          )
        }
      })
    })

    describe('and they are looking at a stream invite', async () => {
      const inviteFromOtherGuy = {
        message: 'some stream invite3',
        user: me,
        stream: otherGuysStream,
        inviteId: '',
        token: ''
      }

      beforeEach(async () => {
        // Create an invite before each test so that we can mutate them
        // in each test as needed
        await createInviteDirectly(inviteFromOtherGuy, otherGuy.id).then((o) => {
          inviteFromOtherGuy.inviteId = o.inviteId
          inviteFromOtherGuy.token = o.token
        })
      })

      const inviteRetrievalDataset = [
        { display: 'by token', withId: true },
        { display: 'without a token', withId: false }
      ]
      inviteRetrievalDataset.forEach(({ display, withId }) => {
        it(`the invite can be retrieved ${display}`, async () => {
          const result = await apollo.execute(GetStreamInviteDocument, {
            streamId: inviteFromOtherGuy.stream.id,
            token: withId ? inviteFromOtherGuy.token : null
          })

          expect(result.data?.streamInvite).to.be.ok
          expect(result.errors).to.not.be.ok

          const data = result.data!.streamInvite!
          expect(data.inviteId).to.eq(inviteFromOtherGuy.inviteId)
          expect(data.token).to.eq(inviteFromOtherGuy.token)
          expect(data.streamId).to.eq(inviteFromOtherGuy.stream.id)
          expect(data.title).to.eq(me.name)

          expect(data.user).to.be.ok
          expect(data.user!.id).eq(me.id)
          expect(data.user!.name).to.eq(me.name)

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
          const token = inviteFromOtherGuy.token
          const inviteId = inviteFromOtherGuy.inviteId
          const streamId = inviteFromOtherGuy.stream.id

          const { data, errors } = await apollo.execute(UseStreamInviteDocument, {
            accept,
            token,
            streamId
          })

          expect(data?.streamInviteUse).to.be.ok
          expect(errors).to.not.be.ok
          expect(await findInvite({ inviteId })).to.be.not.ok

          const userStreamRole = await getUserStreamRole(me.id, streamId)
          expect(userStreamRole).to.eq(accept ? Roles.Stream.Contributor : null)
        })
      })
    })

    describe('and they are managing their own stream collaborators', async () => {
      // Streams
      const myPublicStream: BasicTestStream = {
        name: 'My public stream 1',
        isPublic: true,
        id: '',
        ownerId: ''
      }

      const otherGuysPublicStream: BasicTestStream = {
        name: 'Other guys public stream 1',
        isPublic: true,
        id: '',
        ownerId: ''
      }

      // Invites
      const dynamicInvite = {
        message: 'some stream invite i did3',
        user: otherGuy,
        stream: myPublicStream,
        inviteId: '',
        token: ''
      }

      const myInvite = {
        message: 'another of my streams',
        user: otherGuy,
        stream: myPublicStream,
        inviteId: '',
        token: ''
      }

      const otherGuysInvite = {
        message: 'a stream belonging to the other guy',
        user: me,
        stream: otherGuysPublicStream,
        inviteId: '',
        token: ''
      }

      before(async () => {
        // Create streams
        await createTestStreams([
          [myPublicStream, me],
          [otherGuysPublicStream, otherGuy]
        ])

        // Create a couple of static invites that shouldn't be mutated in tests
        await Promise.all([
          createInviteDirectly(myInvite, me.id).then((o) => {
            myInvite.inviteId = o.inviteId
            myInvite.token = o.token
          }),
          createInviteDirectly(otherGuysInvite, otherGuy.id).then((o) => {
            otherGuysInvite.inviteId = o.inviteId
            otherGuysInvite.token = o.token
          })
        ])
      })

      beforeEach(async () => {
        // Create an invite before each test so that we can mutate them
        // in each test as needed
        await createInviteDirectly(dynamicInvite, me.id).then((o) => {
          dynamicInvite.inviteId = o.inviteId
          dynamicInvite.token = o.token
        })
      })

      it('a pending invite can be deleted', async () => {
        const inviteId = dynamicInvite.inviteId

        const { data, errors } = await apollo.execute(CancelStreamInviteDocument, {
          streamId: dynamicInvite.stream.id,
          inviteId
        })

        expect(data?.streamInviteCancel).to.be.ok
        expect(errors).to.be.not.ok
        expect(await findInvite({ inviteId })).to.be.not.ok
      })

      it('own pending collaborators can be retrieved', async () => {
        const streamId = myPublicStream.id
        const { data, errors } = await apollo.execute(
          GetStreamPendingCollaboratorsDocument,
          {
            streamId
          }
        )

        expect(errors).to.be.not.ok
        expect(data?.stream).to.be.ok
        expect(data!.stream!.id).to.eq(streamId)

        const pendingCollaborators = data!.stream!.pendingCollaborators || []
        expect(pendingCollaborators).to.have.length(1)

        const pendingCollaborator = pendingCollaborators[0]
        expect(pendingCollaborator.user?.id).to.eq(otherGuy.id)

        // tokens shouldn't be resolved, as they're for other people
        expect(pendingCollaborator.token).to.be.null
      })

      it("a foreign stream's pending collaborators can't be retrieved", async () => {
        const streamId = otherGuysPublicStream.id
        const { data, errors } = await apollo.execute(
          GetStreamPendingCollaboratorsDocument,
          {
            streamId
          }
        )

        expect(data?.stream).to.be.ok
        expect(data!.stream!.id).to.eq(streamId)
        expect(data!.stream!.pendingCollaborators).to.be.not.ok
        expect(errors).to.be.ok
        expect(errors!.map((e) => e.message).join('|')).to.contain(
          'You are not authorized to access this resource'
        )
      })
    })

    describe('and they are looking at all of their stream invites', async () => {
      let apollo: TestApolloServer

      const ownInvitesGuy: BasicTestUser = {
        name: "Some guy who's invited a lot",
        email: 'mrinvitedguy111@gmail.com',
        password: 'sn3aky-1337-b1m',
        id: ''
      }

      before(async () => {
        // Create the user
        await createTestUser(ownInvitesGuy)

        // Invite him to a few streams
        await Promise.all([
          createInviteDirectly(
            {
              stream: myPrivateStream,
              // SPecifically w/ email
              email: ownInvitesGuy.email
            },
            me.id
          ),
          createInviteDirectly(
            {
              // Specifically w/ id
              userId: ownInvitesGuy.id,
              stream: otherGuysStream
            },
            otherGuy.id
          )
        ])

        // Build authenticated apollo instance
        apollo = await testApolloServer({ authUserId: ownInvitesGuy.id })
      })

      it('all stream invites can be retrieved successfully', async () => {
        const { data, errors } = await apollo.execute(GetStreamInvitesDocument, {})

        expect(errors).to.be.not.ok
        expect(data?.streamInvites).to.be.ok
        expect(data!.streamInvites.length).to.eq(2)

        const expectedStreamIds = [myPrivateStream.id, otherGuysStream.id]
        const firstInvite = data!.streamInvites[0]
        const secondInvite = data!.streamInvites[1]
        expect(expectedStreamIds.includes(firstInvite.streamId)).to.be.ok
        expect(expectedStreamIds.includes(secondInvite.streamId)).to.be.ok
      })

      it('all project invites can be retrieved successfully', async () => {
        const { data, errors } = await apollo.execute(GetOwnProjectInvitesDocument, {})

        expect(errors).to.be.not.ok
        expect(data?.activeUser?.projectInvites).to.be.ok
        expect(data!.activeUser!.projectInvites.length).to.eq(2)

        const expectedStreamIds = [myPrivateStream.id, otherGuysStream.id]
        const firstInvite = data!.activeUser!.projectInvites[0]
        const secondInvite = data!.activeUser!.projectInvites[1]
        expect(expectedStreamIds.includes(firstInvite.streamId)).to.be.ok
        expect(expectedStreamIds.includes(secondInvite.streamId)).to.be.ok
      })
    })
  })
})
