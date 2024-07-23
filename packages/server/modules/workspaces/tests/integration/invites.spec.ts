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
      })
    })
  })
})
