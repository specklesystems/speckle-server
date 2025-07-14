/* eslint-disable camelcase */
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { setStripeClient } from '@/modules/gatekeeper/clients/stripe'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { getWorkspaceUserSeatFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import {
  GetProjectCollaboratorsDocument,
  UpdateWorkspaceSeatTypeDocument,
  WorkspaceUpdateSeatTypeInput
} from '@/modules/core/graph/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  addToStream,
  BasicTestStream,
  createTestStream
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import dayjs from 'dayjs'
import type { Stripe } from 'stripe'
import { Mock, It, Times } from 'moq.ts'

const getWorkspaceUserSeat = getWorkspaceUserSeatFactory({ db })

describe('Workspace Seats @graphql', () => {
  const workspaceAdmin: BasicTestUser = {
    id: '',
    name: 'Workspace Seats Admin Guy',
    email: createRandomEmail(),
    role: Roles.Server.Admin,
    verified: true
  }
  const workspaceMember: BasicTestUser = {
    id: '',
    name: 'Workspace Seats User Guy',
    email: createRandomEmail(),
    role: Roles.Server.User,
    verified: true
  }

  let apollo: TestApolloServer

  let mockedStripe: Mock<Stripe>
  let mockedStripeSubscriptions: Mock<Stripe.SubscriptionsResource>
  let capturedStripeUpdateArgs: Array<
    Parameters<Stripe.SubscriptionsResource['update']>
  > = []

  before(async () => {
    await beforeEachContext()
    await createTestUsers([workspaceAdmin, workspaceMember])

    apollo = await testApolloServer({ authUserId: workspaceAdmin.id })
  })

  beforeEach(() => {
    // cause we have a fake subscription
    capturedStripeUpdateArgs = []
    mockedStripe = new Mock<Stripe>()

    const fakeStripeSubscription = {
      customer: createRandomString(),
      id: createRandomString(),
      status: 'active',
      cancel_at: null,
      current_period_end: dayjs().add(1, 'month').unix(),
      items: { data: [] }
    } as unknown as Stripe.Response<Stripe.Subscription>

    mockedStripeSubscriptions = new Mock<Stripe.SubscriptionsResource>()
    mockedStripeSubscriptions
      .setup((s) => s.retrieve(It.IsAny()))
      .returnsAsync(fakeStripeSubscription)
      .setup((s) => s.update(It.IsAny(), It.IsAny()))
      .callback((args) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        capturedStripeUpdateArgs.push(args.args as any)
        return Promise.resolve({} as unknown as Stripe.Response<Stripe.Subscription>)
      })

    mockedStripe
      .setup((s) => s.subscriptions)
      .returns(mockedStripeSubscriptions.object())

    setStripeClient(mockedStripe.object())
  })

  after(async () => {
    setStripeClient(undefined)
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

      // ensure update was called at least once
      mockedStripeSubscriptions.verify(
        (s) => s.update(It.IsAny(), It.IsAny()),
        Times.AtLeastOnce()
      )

      expect(capturedStripeUpdateArgs).to.have.length.greaterThan(0)
      const reconcileArgs = capturedStripeUpdateArgs.at(-1)!
      expect(reconcileArgs[1]!.proration_behavior).to.eq('always_invoice')
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

    it('should reduce project role on downgrade to viewer seat', async () => {
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
      await addToStream(userOwnedProject, workspaceAdmin, Roles.Stream.Owner)

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

      // Check project ownership from user perspective, they should have reduced roles
      const res2 = await apollo.execute(
        GetProjectCollaboratorsDocument,
        {
          projectId: userOwnedProject.id
        },
        { assertNoErrors: true, authUserId: user.id }
      )

      expect(res2.data?.project.id).to.eq(userOwnedProject.id)
      expect(res2.data?.project.team.length).to.greaterThanOrEqual(1)

      const userRes = res2.data?.project.team.find((t) => t.id === user.id)
      expect(userRes?.role).to.eq(Roles.Stream.Reviewer)
    })
  })
})
