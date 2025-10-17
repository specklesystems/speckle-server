import { createRandomString } from '@/modules/core/helpers/testHelpers'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser, login } from '@/test/authHelper'
import {
  ApproveJoinRequestDocument,
  DenyJoinRequestDocument,
  DismissWorkspaceDocument,
  GetActiveUserWithWorkspaceJoinRequestsDocument,
  GetWorkspaceTeamDocument,
  GetWorkspaceWithJoinRequestsDocument,
  RequestToJoinWorkspaceDocument
} from '@/modules/core/graph/generated/graphql'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('WorkspaceJoinRequests GQL', () => {
  let admin: BasicTestUser
  let user1: BasicTestUser
  let user2: BasicTestUser
  let user3: BasicTestUser
  let workspace1: BasicTestWorkspace
  let workspace2: BasicTestWorkspace
  let dismissedWorkspace: BasicTestWorkspace
  let workspaceAutoJoin: BasicTestWorkspace

  before(async () => {
    await beforeEachContext()
    ;[admin, user1, user2, user3] = await Promise.all([
      createTestUser({
        name: 'admin user',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      }),
      createTestUser({
        name: 'user 1',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      }),
      createTestUser({
        name: 'user 2',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      }),
      createTestUser({
        name: 'user 3',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      })
    ])
    ;[workspace1, dismissedWorkspace, workspace2, workspaceAutoJoin] =
      await Promise.all([
        await createTestWorkspace(
          {
            id: createRandomString(),
            name: 'Workspace 1',
            ownerId: admin.id,
            description: '',
            discoverabilityEnabled: true
          },
          admin,
          { domain: 'example.org' }
        ),
        await createTestWorkspace(
          {
            id: createRandomString(),
            name: 'should not be visible',
            ownerId: admin.id,
            description: '',
            discoverabilityEnabled: true
          },
          admin,
          {
            domain: 'example.org'
          }
        ),
        await createTestWorkspace(
          {
            id: createRandomString(),
            name: 'Workspace 2',
            ownerId: admin.id,
            description: '',
            discoverabilityEnabled: true
          },
          admin,
          { domain: 'example.org' }
        ),
        await createTestWorkspace(
          {
            id: createRandomString(),
            name: 'Worksapce autojoin',
            ownerId: admin.id,
            description: '',
            discoverabilityEnabled: true,
            discoverabilityAutoJoinEnabled: true
          },
          admin,
          {
            domain: 'example.org'
          }
        )
      ])
  })

  describe('Workspace.adminWorkspacesJoinRequests', () => {
    it('allows users to request joining a workspace', async () => {
      // User1 requests to join workspace1
      const sessionUser1 = await login(user1)
      await sessionUser1.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace1.id } },
        { assertNoErrors: true }
      )

      // admin logs in
      const sessionAdmin = await login(admin)
      const workspace1Res = await sessionAdmin.execute(
        GetWorkspaceWithJoinRequestsDocument,
        { workspaceId: workspace1.id },
        { assertNoErrors: true }
      )

      // has one join request
      const { items: items, totalCount: totalCount } =
        workspace1Res.data!.workspace!.adminWorkspacesJoinRequests!

      expect(totalCount).to.equal(1)
      expect(items).to.have.length(1)
      expect(items[0].status).to.equal('pending')
      expect(items[0].workspace.id).to.equal(workspace1.id)
      expect(items[0].user.id).to.equal(user1.id)
    })

    it('has the ability to dismiss a join request', async () => {
      // User2 requests to join dismissedWorkspace
      const sessionUser2 = await login(user2)
      await sessionUser2.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: dismissedWorkspace.id } },
        { assertNoErrors: true }
      )

      // admins sees a request
      const sessionAdmin = await login(admin)
      const joinRequests = await sessionAdmin.execute(
        GetWorkspaceWithJoinRequestsDocument,
        { workspaceId: dismissedWorkspace.id },
        { assertNoErrors: true }
      )
      const { workspace: joinsWorkspace2 } = joinRequests.data!
      expect(joinsWorkspace2!.adminWorkspacesJoinRequests!.totalCount).to.equal(1)

      // user2 cancels the request
      await sessionUser2.execute(
        DismissWorkspaceDocument,
        { input: { workspaceId: dismissedWorkspace.id } },
        { assertNoErrors: true }
      )

      // no request for admin
      const workspaceDismissedRes = await sessionAdmin.execute(
        GetWorkspaceWithJoinRequestsDocument,
        { workspaceId: dismissedWorkspace.id },
        { assertNoErrors: true }
      )
      const { workspace } = workspaceDismissedRes.data!
      expect(workspace.adminWorkspacesJoinRequests!.items).to.have.lengthOf(0)
      expect(workspace.adminWorkspacesJoinRequests!.totalCount).to.eql(0)
    })
  })

  describe('User.workspaceJoinRequests', () => {
    it('should return the workspace join requests for the user', async () => {
      // User requests to join workspace1 and 2
      const sessionUser = await login(user1)
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace1.id } },
        { assertNoErrors: true }
      )
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace2.id } },
        { assertNoErrors: true }
      )

      const res = await sessionUser.execute(
        GetActiveUserWithWorkspaceJoinRequestsDocument,
        {},
        { assertNoErrors: true }
      )
      const { items, totalCount } = res.data!.activeUser!.workspaceJoinRequests!

      expect(totalCount).to.equal(2)
      expect(items).to.have.length(2)
      expect(items[0].status).to.equal('pending')
      expect(items[0].workspace.id).to.equal(workspace2.id)
      expect(items[0].user.id).to.equal(user1.id)
      expect(items[1].status).to.equal('pending')
      expect(items[1].workspace.id).to.equal(workspace1.id)
      expect(items[1].user.id).to.equal(user1.id)
    })

    it('does not show request that were dissmissed for the user', async () => {
      // User requests to join workspaceDismissed
      const sessionUser = await login(user2)
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: dismissedWorkspace.id } },
        { assertNoErrors: true }
      )

      // dismisses it
      await sessionUser.execute(
        DismissWorkspaceDocument,
        { input: { workspaceId: dismissedWorkspace.id } },
        { assertNoErrors: true }
      )

      const res = await sessionUser.execute(
        GetActiveUserWithWorkspaceJoinRequestsDocument,
        {},
        { assertNoErrors: true }
      )
      const { items, totalCount } = res.data!.activeUser!.workspaceJoinRequests!

      expect(totalCount).to.equal(0)
      expect(items).to.have.length(0)
    })
  })

  describe('joining a workspace', () => {
    it('allows admin accepting a join request to a workspace', async () => {
      const sessionAdmin = await login(admin)
      const sessionUser = await login(user1)

      // User requests to join workspace1
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace1.id } },
        { assertNoErrors: true }
      )

      await sessionAdmin.execute(
        ApproveJoinRequestDocument,
        { input: { workspaceId: workspace1.id, userId: user1.id } },
        { assertNoErrors: true }
      )

      const res = await sessionAdmin.execute(GetWorkspaceTeamDocument, {
        workspaceId: workspace1.id
      })

      const { items, totalCount } = res.data!.workspace.team

      expect(totalCount).to.equal(2)
      expect(items).to.have.length(2)
      expect(items[0].id).to.equal(user1.id)
    })

    it('allows admin denying a join request to a workspace', async () => {
      const sessionAdmin = await login(admin)
      const sessionUser = await login(user2)

      // User requests to join workspace1
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace2.id } },
        { assertNoErrors: true }
      )

      await sessionAdmin.execute(
        DenyJoinRequestDocument,
        { input: { workspaceId: workspace2.id, userId: user2.id } },
        { assertNoErrors: true }
      )

      const res = await sessionAdmin.execute(GetWorkspaceTeamDocument, {
        workspaceId: workspace2.id
      })

      const { items, totalCount } = res.data!.workspace.team

      expect(totalCount).to.equal(1)
      expect(items).to.have.length(1)
    })

    it('doesnt allow the joiner user to hack around their way into a workspace', async () => {
      const sessionAdmin = await login(admin)
      const sessionUser = await login(user3)

      // User requests to join workspace1
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspace2.id } },
        { assertNoErrors: true }
      )

      // Accepts himself
      const autoAcceptAttempt = await sessionUser.execute(
        ApproveJoinRequestDocument,
        { input: { workspaceId: workspace2.id, userId: user3.id } },
        { assertNoErrors: false }
      )

      const autoDenyAttempt = await sessionUser.execute(
        DenyJoinRequestDocument,
        { input: { workspaceId: workspace2.id, userId: user3.id } },
        { assertNoErrors: false }
      )

      const res = await sessionAdmin.execute(GetWorkspaceTeamDocument, {
        workspaceId: workspace2.id
      })

      const { items, totalCount } = res.data!.workspace.team

      const AUTH_ERROR = 'You are not authorized to access this resource.'
      expect(autoAcceptAttempt).to.haveGraphQLErrors()
      expect(autoAcceptAttempt.errors![0].message).to.contain(AUTH_ERROR)
      expect(autoDenyAttempt).to.haveGraphQLErrors()
      expect(autoDenyAttempt.errors![0].message).to.contain(AUTH_ERROR)
      expect(totalCount).to.equal(1)
      expect(items).to.have.length(1)
    })

    it('can auto join if admin had previously preconfigured it', async () => {
      const sessionAdmin = await login(admin)
      const sessionUser = await login(user3)

      // User requests to join workspace1
      await sessionUser.execute(
        RequestToJoinWorkspaceDocument,
        { input: { workspaceId: workspaceAutoJoin.id } },
        { assertNoErrors: true }
      )

      const res = await sessionAdmin.execute(GetWorkspaceTeamDocument, {
        workspaceId: workspaceAutoJoin.id
      })

      const { items, totalCount } = res.data!.workspace.team

      expect(totalCount).to.equal(2)
      expect(items).to.have.length(2)
      expect(items[0].id).to.equal(user3.id)
    })
  })
})
