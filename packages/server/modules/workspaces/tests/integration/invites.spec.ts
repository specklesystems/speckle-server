import {
  BasicTestWorkspace,
  createTestWorkspaces
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { describe } from 'mocha'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import {
  CreateWorkspaceInviteDocument,
  CreateWorkspaceInviteMutationVariables,
  WorkspaceRole
} from '@/test/graphql/generated/graphql'
import { expect } from 'chai'
import { validateInviteExistanceFromEmail } from '@/test/speckle-helpers/inviteHelper'

/**
 * TODO:
 * - Create w/ email, create w/ user id
 * - Create by admins only
 * - Resource access rules (token w/o access to workspace)
 * - Token empty
 * - invitedTeam inacceessible (hasWorkspaceROle)
 */

describe('Workspaces Invites', () => {
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

  const myFirstWorkspace: BasicTestWorkspace = {
    name: 'My First Workspace',
    id: '',
    ownerId: ''
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([me, otherGuy])
    await createTestWorkspaces([[myFirstWorkspace, me]])
  })

  afterEach(() => {
    EmailSendingServiceMock.resetMockedFunctions()
  })

  describe('when authenticated', () => {
    let apollo: TestApolloServer

    before(async () => {
      apollo = await testApolloServer({
        authUserId: me.id
      })
    })

    describe('and inviting to workspace', () => {
      const createInvite = (args: CreateWorkspaceInviteMutationVariables) =>
        apollo.execute(CreateWorkspaceInviteDocument, args)

      it('works when inviting user by ID', async () => {
        const sendEmailInvocations = EmailSendingServiceMock.hijackFunction(
          'sendEmail',
          async () => true
        )

        const res = await createInvite({
          workspaceId: myFirstWorkspace.id,
          input: {
            userId: otherGuy.id,
            role: WorkspaceRole.Member
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceMutations?.invites?.create).to.be.ok

        const workspace = res.data!.workspaceMutations!.invites!.create
        expect(workspace.invitedTeam).to.have.length(1)
        expect(workspace.invitedTeam![0].invitedBy.id).to.equal(me.id)
        expect(workspace.invitedTeam![0].user?.id).to.equal(otherGuy.id)
        expect(workspace.invitedTeam![0].token).to.be.not.ok

        expect(sendEmailInvocations.args).to.have.lengthOf(1)
        const emailParams = sendEmailInvocations.args[0][0]
        expect(emailParams).to.be.ok
        expect(emailParams.to).to.eq(otherGuy.email)
        expect(emailParams.subject).to.be.ok

        // Validate that invite exists
        await validateInviteExistanceFromEmail(emailParams)
      })
    })
  })
})
