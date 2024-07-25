import {
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestWorkspaces,
  createWorkspaceInviteDirectly,
  unassignFromWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import {
  ExecuteOperationOptions,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { describe } from 'mocha'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import {
  BatchCreateWorkspaceInvitesDocument,
  BatchCreateWorkspaceInvitesMutationVariables,
  CancelWorkspaceInviteDocument,
  CancelWorkspaceInviteMutationVariables,
  CreateWorkspaceInviteDocument,
  CreateWorkspaceInviteMutationVariables,
  GetMyWorkspaceInvitesDocument,
  GetWorkspaceInviteDocument,
  GetWorkspaceInviteQueryVariables,
  GetWorkspaceWithTeamDocument,
  GetWorkspaceWithTeamQueryVariables,
  UseWorkspaceInviteDocument,
  UseWorkspaceInviteMutationVariables,
  UseWorkspaceProjectInviteDocument,
  UseWorkspaceProjectInviteMutationVariables,
  WorkspaceRole
} from '@/test/graphql/generated/graphql'
import { expect } from 'chai'
import {
  createStreamInviteDirectlyFactory,
  validateInviteExistanceFromEmail
} from '@/test/speckle-helpers/inviteHelper'
import { MaybeAsync, Roles } from '@speckle/shared'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { ServerInvites } from '@/modules/core/dbSchema'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { times } from 'lodash'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { db } from '@/db/knex'
import {
  BasicTestStream,
  createTestStreams,
  leaveStream
} from '@/test/speckle-helpers/streamHelper'
import { authorizeResolver } from '@/modules/shared'
import { ForbiddenError } from 'apollo-server-express'
import { Workspaces } from '@/modules/workspaces/helpers/db'

enum InviteByTarget {
  Email = 'email',
  Id = 'id'
}

describe('Workspaces Invites GQL', () => {
  const me: BasicTestUser = {
    name: 'Authenticated server invites guy',
    email: 'serverinvitesguy@gmail.com',
    id: ''
  }

  const otherGuy: BasicTestUser = {
    name: 'Some Other DUde',
    email: 'otherguy111@gmail.com',
    id: ''
  }

  const myWorkspaceFriend: BasicTestUser = {
    name: 'My Workspace Friend',
    email: 'myworkspacefriend@asdasd.com',
    id: ''
  }

  const myFirstWorkspace: BasicTestWorkspace = {
    name: 'My First Workspace',
    id: '',
    ownerId: ''
  }

  const otherGuysWorkspace: BasicTestWorkspace = {
    name: 'Other Guy Workspace',
    id: '',
    ownerId: ''
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me, otherGuy, myWorkspaceFriend])
    await createTestWorkspaces([
      [myFirstWorkspace, me],
      [otherGuysWorkspace, otherGuy]
    ])
    await assignToWorkspaces([
      [otherGuysWorkspace, me, Roles.Workspace.Member],
      [myFirstWorkspace, myWorkspaceFriend, Roles.Workspace.Member]
    ])
  })

  afterEach(() => {
    EmailSendingServiceMock.resetMockedFunctions()
  })

  describe('when authenticated', () => {
    let apollo: TestApolloServer

    const createInvite = (
      args: CreateWorkspaceInviteMutationVariables,
      options?: ExecuteOperationOptions
    ) => apollo.execute(CreateWorkspaceInviteDocument, args, options)

    const batchCreateInvites = (
      args: BatchCreateWorkspaceInvitesMutationVariables,
      options?: ExecuteOperationOptions
    ) => apollo.execute(BatchCreateWorkspaceInvitesDocument, args, options)

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
    })

    describe('and inviting to workspace', () => {
      afterEach(async () => {
        await truncateTables([ServerInvites.name])
      })

      it("doesn't work when inviting user to workspace that doesn't exist", async () => {
        const res = await createInvite({
          workspaceId: 'a',
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work when inviting nonexistant user ID", async () => {
        const res = await createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            userId: 'a',
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('Attempting to invite an invalid user')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work if neither email nor user id specified", async () => {
        const res = await createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('Either email or userId must be specified')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it("doesn't work if not workspace admin", async () => {
        const res = await createInvite({
          workspaceId: otherGuysWorkspace.id,
          input: {
            userId: myWorkspaceFriend.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      it('batch inviting fails if more than 10 invites', async () => {
        const res = await batchCreateInvites({
          workspaceId: myFirstWorkspace.id,
          input: times(11, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.haveGraphQLErrors(
          'Maximum 10 invites can be sent at once by non admins'
        )
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting fails if not workspace admin', async () => {
        const res = await batchCreateInvites({
          workspaceId: otherGuysWorkspace.id,
          input: times(10, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting fails if resourceAccessRules prevent workspace access', async () => {
        const res = await batchCreateInvites(
          {
            workspaceId: myFirstWorkspace.id,
            input: times(10, () => ({
              email: `asdasasd${Math.random()}@gmail.com`,
              role: WorkspaceRole.Member
            }))
          },
          {
            context: {
              resourceAccessRules: [
                {
                  id: otherGuysWorkspace.id,
                  type: TokenResourceIdentifierType.Workspace
                }
              ]
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.not.be.ok
      })

      it('batch inviting works', async () => {
        const count = 10

        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true,
          { times: count }
        )

        const res = await batchCreateInvites({
          workspaceId: myFirstWorkspace.id,
          input: times(count, () => ({
            email: `asdasasd${Math.random()}@gmail.com`,
            role: WorkspaceRole.Member
          }))
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.batchCreate).to.be.ok
        expect(
          res.data?.workspaceMutations?.invites?.batchCreate?.invitedTeam
        ).to.have.length(count)

        expect(sendEmailInvocations.args).to.have.lengthOf(count)
      })

      itEach(
        [InviteByTarget.Email, InviteByTarget.Id],
        (type) => `works when inviting user by ${type}`,
        async (type) => {
          const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
            'sendEmail',
            async () => true
          )

          const randomUnregisteredEmail = 'randomunregisteredguy@email.com'

          const res = await createInvite({
            workspaceId: myFirstWorkspace.id,
            input: {
              ...(type === InviteByTarget.Email
                ? { email: randomUnregisteredEmail }
                : {}),
              ...(type === InviteByTarget.Id ? { userId: otherGuy.id } : {}),
              role: WorkspaceRole.Member
            }
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspaceMutations?.invites?.create).to.be.ok

          const workspace = res.data!.workspaceMutations!.invites!.create
          expect(workspace.invitedTeam).to.have.length(1)
          expect(workspace.invitedTeam![0].invitedBy.id).to.equal(me.id)
          expect(workspace.invitedTeam![0].token).to.be.not.ok

          if (type === InviteByTarget.Email) {
            expect(workspace.invitedTeam![0].user).to.be.not.ok
            expect(workspace.invitedTeam![0].title).to.equal(randomUnregisteredEmail)
          } else {
            expect(workspace.invitedTeam![0].user?.id).to.equal(otherGuy.id)
          }

          expect(sendEmailInvocations.args).to.have.lengthOf(1)
          const emailParams = sendEmailInvocations.args[0][0]
          expect(emailParams).to.be.ok
          expect(emailParams.to).to.eq(
            type === InviteByTarget.Id ? otherGuy.email : randomUnregisteredEmail
          )
          expect(emailParams.subject).to.be.ok

          // Validate that invite exists
          await validateInviteExistanceFromEmail(emailParams)
        }
      )

      it("doesn't work if inviting to a workspace that the token doesn't have access to", async () => {
        const res = await createInvite(
          {
            workspaceId: myFirstWorkspace.id,
            input: {
              userId: otherGuy.id,
              role: WorkspaceRole.Member
            }
          },
          {
            context: {
              resourceAccessRules: [
                {
                  id: otherGuysWorkspace.id,
                  type: TokenResourceIdentifierType.Workspace
                }
              ]
            }
          }
        )

        expect(res).to.haveGraphQLErrors(
          'You are not authorized to access this resource'
        )
        expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
      })

      itEach(
        [InviteByTarget.Email, InviteByTarget.Id],
        (type) => `fails when inviting user by ${type} that already has a role`,
        async (type) => {
          const res = await createInvite({
            workspaceId: myFirstWorkspace.id,
            input: {
              ...(type === InviteByTarget.Email
                ? { email: myWorkspaceFriend.email }
                : {}),
              ...(type === InviteByTarget.Id ? { userId: myWorkspaceFriend.id } : {}),
              role: WorkspaceRole.Member
            }
          })

          expect(res).to.haveGraphQLErrors(
            'The target user is already a member of the specified workspace'
          )
          expect(res.data?.workspaceMutations?.invites?.create).to.not.be.ok
        }
      )
    })

    describe('and administrating invites', () => {
      const myAdministrationWorkspace: BasicTestWorkspace = {
        name: 'My Administration Workspace',
        id: '',
        ownerId: ''
      }

      const cancelableInvite = {
        workspaceId: '',
        inviteId: ''
      }

      const cancelInvite = async (
        args: CancelWorkspaceInviteMutationVariables,
        options?: ExecuteOperationOptions
      ) => apollo.execute(CancelWorkspaceInviteDocument, args, options)

      before(async () => {
        await createTestWorkspaces([[myAdministrationWorkspace, me]])
        await assignToWorkspaces([
          [myAdministrationWorkspace, myWorkspaceFriend, Roles.Workspace.Guest]
        ])
        await batchCreateInvites(
          {
            workspaceId: myAdministrationWorkspace.id,
            input: times(10, () => ({
              email: `aszzzdasasd${Math.random()}@gmail.com`,
              role: WorkspaceRole.Member
            }))
          },
          { assertNoErrors: true }
        )
      })

      beforeEach(async () => {
        const inviteData = await createWorkspaceInviteDirectly(
          {
            workspaceId: myAdministrationWorkspace.id,
            input: {
              email: 'someRandomCancelableInviteGuy@asdasd.com',
              role: WorkspaceRole.Member
            }
          },
          me.id
        )
        cancelableInvite.workspaceId = myAdministrationWorkspace.id
        cancelableInvite.inviteId = inviteData.inviteId
      })

      const getWorkspaceWithTeam = async (
        args: GetWorkspaceWithTeamQueryVariables,
        options?: ExecuteOperationOptions
      ) => apollo.execute(GetWorkspaceWithTeamDocument, args, options)

      it("can't list invites, if not admin", async () => {
        const res = await getWorkspaceWithTeam(
          {
            workspaceId: myAdministrationWorkspace.id
          },
          {
            context: {
              userId: myWorkspaceFriend.id
            }
          }
        )

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspace).to.be.ok
        expect(res.data?.workspace.invitedTeam).to.be.not.ok
      })

      it('can list invites, if admin', async () => {
        const res = await getWorkspaceWithTeam({
          workspaceId: myAdministrationWorkspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace).to.be.ok
        expect(res.data?.workspace.invitedTeam).to.have.length(11)
      })

      it("can't cancel invite, if not admin", async () => {
        const res = await cancelInvite(cancelableInvite, {
          context: {
            userId: myWorkspaceFriend.id
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.cancel).to.not.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.ok
      })

      it('can cancel invite, if admin', async () => {
        const res = await cancelInvite(cancelableInvite)

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.cancel).to.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.not.ok
      })

      it("can't cancel invite if resourceAccessRules prevent it", async () => {
        const res = await cancelInvite(cancelableInvite, {
          context: {
            resourceAccessRules: [
              {
                id: otherGuysWorkspace.id,
                type: TokenResourceIdentifierType.Workspace
              }
            ]
          }
        })

        expect(res).to.haveGraphQLErrors('You are not authorized')
        expect(res.data?.workspaceMutations?.invites?.cancel).to.not.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: cancelableInvite.inviteId
        })
        expect(invite).to.be.ok
      })
    })

    describe('and looking at a specific invite', () => {
      const myInviteTargetWorkspace: BasicTestWorkspace = {
        name: 'My Invite Target Workspace',
        id: '',
        ownerId: ''
      }
      const myInviteTargetWorkspaceStream1: BasicTestStream = {
        name: 'My Invite Target Workspace Stream 1',
        id: '',
        ownerId: '',
        isPublic: false
      }

      const processableWorkspaceInvite = {
        workspaceId: '',
        inviteId: '',
        token: ''
      }

      const processableProjectInvite = {
        projectId: '',
        inviteId: '',
        token: ''
      }

      const useInvite = async (
        args: UseWorkspaceInviteMutationVariables,
        options?: ExecuteOperationOptions
      ) => apollo.execute(UseWorkspaceInviteDocument, args, options)

      const getInvite = async (
        args: GetWorkspaceInviteQueryVariables,
        options?: ExecuteOperationOptions
      ) => apollo.execute(GetWorkspaceInviteDocument, args, options)

      const getMyInvites = async (options?: ExecuteOperationOptions) =>
        apollo.execute(GetMyWorkspaceInvitesDocument, {}, options)

      const useProjectInvite = async (
        args: UseWorkspaceProjectInviteMutationVariables,
        options?: ExecuteOperationOptions
      ) => apollo.execute(UseWorkspaceProjectInviteDocument, args, options)

      const validateResourceAccess = async (params: { shouldHaveAccess: boolean }) => {
        const { shouldHaveAccess } = params

        const wrapAccessCheck = async (fn: () => MaybeAsync<unknown>) => {
          if (shouldHaveAccess) {
            await fn()
          } else {
            const e = await expectToThrow(fn)
            expect(e instanceof ForbiddenError).to.be.true
          }
        }

        await wrapAccessCheck(() =>
          authorizeResolver(
            otherGuy.id,
            myInviteTargetWorkspace.id,
            Roles.Workspace.Guest
          )
        )
        await wrapAccessCheck(() =>
          authorizeResolver(
            otherGuy.id,
            myInviteTargetWorkspaceStream1.id,
            Roles.Stream.Reviewer
          )
        )
      }

      before(async () => {
        await truncateTables([ServerInvites.name])
        await createTestWorkspaces([[myInviteTargetWorkspace, me]])

        myInviteTargetWorkspaceStream1.workspaceId = myInviteTargetWorkspace.id
        await createTestStreams([[myInviteTargetWorkspaceStream1, me]])
      })

      beforeEach(async () => {
        const workspaceInvite = await createWorkspaceInviteDirectly(
          {
            workspaceId: myInviteTargetWorkspace.id,
            input: {
              userId: otherGuy.id,
              role: WorkspaceRole.Member
            }
          },
          me.id
        )
        processableWorkspaceInvite.workspaceId = myInviteTargetWorkspace.id
        processableWorkspaceInvite.inviteId = workspaceInvite.inviteId
        processableWorkspaceInvite.token = workspaceInvite.token

        const projectInvite = await createStreamInviteDirectlyFactory({ db })(
          {
            user: otherGuy,
            stream: myInviteTargetWorkspaceStream1
          },
          me.id
        )
        processableProjectInvite.projectId = myInviteTargetWorkspaceStream1.id
        processableProjectInvite.inviteId = projectInvite.inviteId
        processableProjectInvite.token = projectInvite.token
      })

      afterEach(async () => {
        // Serial execution to avoid race conditions
        await unassignFromWorkspace(myInviteTargetWorkspace, otherGuy)
        await leaveStream(myInviteTargetWorkspaceStream1, otherGuy)
      })

      it("can't retrieve it if not the invitee and no token specified", async () => {
        const res = await getInvite({
          workspaceId: myInviteTargetWorkspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.be.not.ok
      })

      it('can retrieve it even if not the invitee, as long as the token is valid', async () => {
        const res = await getInvite({
          workspaceId: myInviteTargetWorkspace.id,
          token: processableWorkspaceInvite.token
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceInvite).to.be.ok
        expect(res.data!.workspaceInvite?.user!.id).to.equal(otherGuy.id)
      })

      it("can't retrieve broken invite with invalid workspaceIds", async () => {
        const brokenWorkspace: BasicTestWorkspace = {
          name: 'Broken Workspace',
          id: 'a',
          ownerId: ''
        }
        await createTestWorkspaces([[brokenWorkspace, me]])

        const brokenInvite = await createWorkspaceInviteDirectly(
          {
            workspaceId: brokenWorkspace.id,
            input: {
              userId: otherGuy.id,
              role: WorkspaceRole.Member
            }
          },
          me.id
        )
        expect(brokenInvite.inviteId).to.be.ok

        // Db query directly, cause this isn't a supported use case
        await Workspaces.knex()
          .where({ [Workspaces.col.id]: brokenWorkspace.id })
          .del()

        const res1 = await getInvite(
          {
            workspaceId: brokenWorkspace.id
          },
          {
            context: {
              userId: otherGuy.id
            }
          }
        )

        expect(res1).to.not.haveGraphQLErrors('')
        expect(res1.data?.workspaceInvite).to.eq(null)

        const res2 = await getMyInvites({
          context: {
            userId: otherGuy.id
          }
        })

        expect(res2).to.not.haveGraphQLErrors()
        expect(res2.data?.activeUser?.workspaceInvites).to.be.ok
        expect(
          res2.data!.activeUser!.workspaceInvites.find(
            (i) => i.workspaceId === brokenWorkspace.id
          )
        ).to.not.be.ok
      })

      itEach(
        [{ withToken: true }, { withToken: false }],
        (test) =>
          `can retrieve it if the invitee ${
            test.withToken ? 'and specifying token' : 'and omitting token'
          }`,
        async (test) => {
          const res = await getInvite(
            {
              workspaceId: myInviteTargetWorkspace.id,
              token: test.withToken ? processableWorkspaceInvite.token : undefined
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors('')
          expect(res.data?.workspaceInvite).to.be.ok
          expect(res.data!.workspaceInvite!.inviteId).to.equal(
            processableWorkspaceInvite.inviteId
          )
          expect(res.data!.workspaceInvite!.workspaceId).to.equal(
            myInviteTargetWorkspace.id
          )
          expect(res.data!.workspaceInvite!.token).to.equal(
            processableWorkspaceInvite.token
          )
        }
      )

      itEach(
        [{ hasSome: true }, { hasSome: false }],
        (test) =>
          `can get all of my invites ${
            test.hasSome ? 'when there are some' : 'when there are none'
          }`,
        async (test) => {
          const res = await getMyInvites({
            context: {
              userId: test.hasSome ? otherGuy.id : me.id
            }
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.activeUser?.workspaceInvites).to.be.ok

          if (test.hasSome) {
            expect(res.data?.activeUser?.workspaceInvites).to.have.length(1)
            expect(res.data?.activeUser?.workspaceInvites![0].inviteId).to.equal(
              processableWorkspaceInvite.inviteId
            )
            expect(res.data?.activeUser?.workspaceInvites![0].workspaceId).to.equal(
              myInviteTargetWorkspace.id
            )
          } else {
            expect(res.data?.activeUser?.workspaceInvites).to.have.length(0)
          }
        }
      )

      itEach(
        [{ accept: true }, { accept: false }],
        ({ accept }) => `can ${accept ? 'accept' : 'decline'} the invite`,
        async ({ accept }) => {
          const res = await useInvite(
            {
              input: {
                accept,
                token: processableWorkspaceInvite.token
              }
            },
            {
              context: {
                userId: otherGuy.id
              }
            }
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspaceMutations?.invites?.use).to.be.ok

          const invite = await findInviteFactory({ db })({
            inviteId: processableWorkspaceInvite.inviteId
          })
          expect(invite).to.be.not.ok

          await validateResourceAccess({ shouldHaveAccess: accept })
        }
      )

      it('accepting workspace project invite also adds user to workspace', async () => {
        const res = await useProjectInvite(
          {
            input: {
              token: processableProjectInvite.token,
              accept: true,
              projectId: processableProjectInvite.projectId
            }
          },
          {
            context: {
              userId: otherGuy.id
            }
          }
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.projectMutations?.invites?.use).to.be.ok

        const invite = await findInviteFactory({ db })({
          inviteId: processableProjectInvite.inviteId
        })
        expect(invite).to.be.not.ok

        await validateResourceAccess({ shouldHaveAccess: true })
      })
    })
  })
})
