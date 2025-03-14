import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { deleteProjectRoleFactory } from '@/modules/core/repositories/streams'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { getWorkspaceUserSeatFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  GetProjectCollaboratorsDocument,
  UpdateWorkspaceSeatTypeDocument,
  WorkspaceUpdateSeatTypeInput
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { StripeClientMock } from '@/test/mocks/global'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

const getWorkspaceUserSeat = getWorkspaceUserSeatFactory({ db })

describe('Workspace Seats @graphql', () => {
  const workspaceAdmin: BasicTestUser = {
    id: '',
    name: 'Workspace Seats Admin Guy',
    email: createRandomEmail(),
    role: Roles.Server.Admin,
    verified: true
  }

  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    await createTestUser(workspaceAdmin)

    apollo = await testApolloServer({ authUserId: workspaceAdmin.id })
  })

  beforeEach(() => {
    // cause we have a fake subscription
    StripeClientMock.mockFunction(
      'reconcileWorkspaceSubscriptionFactory',
      () => async () => {}
    )
  })

  after(async () => {
    StripeClientMock.resetMockedFunctions()
  })

  describe('when being changed', () => {
    const testWorkspace1: BasicTestWorkspace = {
      id: '',
      slug: '',
      ownerId: '',
      name: 'Test Workspace 1'
    }

    before(async () => {
      await createTestWorkspace(testWorkspace1, workspaceAdmin, {
        addPlan: { name: 'pro', status: 'valid' },
        addSubscription: true
      })
    })

    const updateSeatType = (input: WorkspaceUpdateSeatTypeInput) =>
      apollo.execute(UpdateWorkspaceSeatTypeDocument, { input })

    it('should throw an error if user is not a member of the workspace', async () => {
      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      }
      await createTestUser(user)

      const res = await updateSeatType({
        workspaceId: testWorkspace1.id,
        userId: user.id,
        seatType: WorkspaceSeatType.Editor
      })

      expect(res).to.haveGraphQLErrors('User does not have a role in the workspace')
      expect(res.data?.workspaceMutations.updateSeatType).to.not.be.ok
    })

    it('should throw an error if seat type is not compatible with workspace role', async () => {
      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      }
      await createTestUser(user)
      await assignToWorkspace(testWorkspace1, user, Roles.Workspace.Admin)

      const res = await updateSeatType({
        workspaceId: testWorkspace1.id,
        userId: user.id,
        seatType: WorkspaceSeatType.Viewer
      })

      expect(res).to.haveGraphQLErrors('cannot have a seat of type')
      expect(res.data?.workspaceMutations.updateSeatType).to.not.be.ok
    })

    it('should upgrade a workspace seat and reconcile subscription', async () => {
      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      }
      await createTestUser(user)
      await assignToWorkspace(testWorkspace1, user, Roles.Workspace.Member)
      const oldSeat = await getWorkspaceUserSeat({
        workspaceId: testWorkspace1.id,
        userId: user.id
      })
      expect(oldSeat?.type).to.eq(WorkspaceSeatType.Viewer)

      const { args, length: reconciledTimes } = StripeClientMock.hijackFactoryFunction(
        'reconcileWorkspaceSubscriptionFactory',
        async () => {}
      )

      const res = await updateSeatType({
        workspaceId: testWorkspace1.id,
        userId: user.id,
        seatType: WorkspaceSeatType.Editor
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(
        res.data?.workspaceMutations.updateSeatType.team.items.find(
          (i) => i.id === user.id
        )?.seatType
      ).to.eq(WorkspaceSeatType.Editor)
      expect(reconciledTimes() > 0).to.be.true

      const reconcileArgs = args[0][0]
      expect(reconcileArgs.prorationBehavior).to.eq('always_invoice') // new plan
      expect(reconcileArgs.subscriptionData.products.length).to.be.ok
    })

    it('should downgrade a workspace seat', async () => {
      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      }
      await createTestUser(user)
      await assignToWorkspace(
        testWorkspace1,
        user,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      )

      const res = await updateSeatType({
        workspaceId: testWorkspace1.id,
        userId: user.id,
        seatType: WorkspaceSeatType.Viewer
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(
        res.data?.workspaceMutations.updateSeatType.team.items.find(
          (i) => i.id === user.id
        )?.seatType
      ).to.eq(WorkspaceSeatType.Viewer)
    })

    it('should assign away project ownership on downgrade to viewer seat', async () => {
      const testWorkspace2: BasicTestWorkspace = {
        id: '',
        slug: '',
        ownerId: '',
        name: 'Test Workspace 2'
      }
      await createTestWorkspace(testWorkspace2, workspaceAdmin, {
        addPlan: { name: 'pro', status: 'valid' }
      })

      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      }
      await createTestUser(user)
      await assignToWorkspace(
        testWorkspace2,
        user,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      )

      const userOwnedProject: BasicTestStream = {
        name: 'User Owned Project',
        isPublic: false,
        id: '',
        ownerId: '',
        workspaceId: testWorkspace2.id
      }
      await createTestStream(userOwnedProject, user)

      // Manually remove admin stream role, to test that it's being added
      await deleteProjectRoleFactory({ db })({
        projectId: userOwnedProject.id,
        userId: workspaceAdmin.id
      })

      const res1 = await updateSeatType({
        workspaceId: testWorkspace2.id,
        userId: user.id,
        seatType: WorkspaceSeatType.Viewer
      })

      expect(res1).to.not.haveGraphQLErrors()
      expect(
        res1.data?.workspaceMutations.updateSeatType.team.items.find(
          (i) => i.id === user.id
        )?.seatType
      ).to.eq(WorkspaceSeatType.Viewer)

      // Check project ownership
      const res2 = await apollo.execute(
        GetProjectCollaboratorsDocument,
        {
          projectId: userOwnedProject.id
        },
        { assertNoErrors: true }
      )

      expect(res2.data?.project.id).to.eq(userOwnedProject.id)
      expect(res2.data?.project.team.length).to.greaterThanOrEqual(2)

      const adminRes = res2.data?.project.team.find((t) => t.id === workspaceAdmin.id)
      const userRes = res2.data?.project.team.find((t) => t.id === user.id)
      expect(adminRes?.role).to.eq(Roles.Stream.Owner)
      expect(userRes?.role).to.eq(Roles.Stream.Reviewer)
    })
  })
})
