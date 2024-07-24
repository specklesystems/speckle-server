import {
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestWorkspaces,
  createWorkspaceInviteDirectly
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
  GetWorkspaceWithTeamDocument,
  GetWorkspaceWithTeamQueryVariables,
  WorkspaceRole
} from '@/test/graphql/generated/graphql'
import { expect } from 'chai'
import { validateInviteExistanceFromEmail } from '@/test/speckle-helpers/inviteHelper'
import { Roles } from '@speckle/shared'
import { itEach } from '@/test/assertionHelper'
import { ServerInvites } from '@/modules/core/dbSchema'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import { times } from 'lodash'
import { findInviteFactory } from '@/modules/serverinvites/repositories/serverInvites'
import { db } from '@/db/knex'

/**
 * TODO:
 * - Token filled
 * - invitedTeam inacceessible (hasWorkspaceROle)
 *
 * - Register w/ project/server/workspace invite
 */

enum InviteByTarget {
  Email = 'email',
  Id = 'id'
}

describe('Workspaces Invites', () => {
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
        expect(res.data?.workspace.invitedTeam).to.have.length(10)
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
  })
})
