import { workspaceTrackingFactory } from '@/modules/workspaces/events/eventListener'
import { buildTestUserWithOptionalRole } from '@/test/authHelper'
import {
  buildTestWorkspaceSeat,
  buildTestWorkspaceWithOptionalRole
} from '@/modules/workspaces/tests/helpers/creation'
import {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetDefaultRegion,
  GetWorkspace,
  GetWorkspaceModelCount,
  GetWorkspaceSeatCount,
  GetWorkspacesProjectsCounts
} from '@/modules/workspaces/domain/operations'
import {
  buildTestWorkspacePlan,
  buildTestWorkspaceSubscription
} from '@/modules/gatekeeper/tests/helpers/workspacePlan'
import {
  GetWorkspacePlan,
  GetWorkspaceSubscription,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  buildMixpanelFake,
  MixpanelFakeEventRecord
} from '@/modules/shared/test/helpers/mixpanel'
import { getFeatureFlags } from '@speckle/shared/environment'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import {
  mapPlanStatusToMixpanelEvent,
  MixpanelEvents
} from '@/modules/shared/utils/mixpanel'
import { expect } from 'chai'
import { WorkspacePlans, WorkspacePlanStatuses } from '@speckle/shared'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { GetUser } from '@/modules/core/domain/users/operations'
import cryptoRandomString from 'crypto-random-string'
import { BillingInterval } from '@/modules/core/graph/generated/graphql'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
  'workspaceTrackingFactory creates a function, that @workspaceEventListener',
  () => {
    const workspace = buildTestWorkspaceWithOptionalRole()
    const user = buildTestUserWithOptionalRole()
    const email = {
      id: user.id,
      email: user.email,
      primary: true,
      verified: true,
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const region = {
      key: 'reg-1',
      name: 'Region',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const workspacePlan = buildTestWorkspacePlan({ workspaceId: workspace.id })
    const workspaceSubscribtion = buildTestWorkspaceSubscription({
      workspaceId: workspace.id
    })

    const getUser: GetUser = async () => user
    const getWorkspace: GetWorkspace = async () => workspace
    const countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole = async () => 0
    const getDefaultRegion: GetDefaultRegion = async () => region
    const getWorkspacePlan: GetWorkspacePlan = async () => workspacePlan
    const getWorkspaceSubscription: GetWorkspaceSubscription = async () =>
      workspaceSubscribtion
    const getUserEmails: FindEmailsByUserId = async () => [email]
    const getWorkspaceModelCount: GetWorkspaceModelCount = async () => 20
    const getWorkspacesProjectCount: GetWorkspacesProjectsCounts = async () => ({
      [workspace.id]: 10
    })
    const getWorkspaceSeatCount: GetWorkspaceSeatCount = async () => 5

    const defaults = {
      getWorkspace,
      countWorkspaceRole,
      getDefaultRegion,
      getWorkspacePlan,
      getWorkspaceSubscription,
      getUserEmails,
      getUser,
      getWorkspaceModelCount,
      getWorkspacesProjectCount,
      getWorkspaceSeatCount
    }

    it('pushes a Mixpanel Upgrade event when workspace plan was upgraded to non paid', async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspacePlanUpdated,
        payload: {
          userId: cryptoRandomString({ length: 10 }),
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Academia
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Free
          })
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.eventName).to.be.eq(MixpanelEvents.WorkspaceUpgraded)
      expect(event.workspaceId).to.be.eq(workspace.id)
      expect(event.payload).to.be.deep.eq({
        plan: WorkspacePlans.Academia,
        previousPlan: WorkspacePlans.Free
      })
    })

    it("doesn't notify when subscription is the same", async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })
      const plan = buildTestWorkspacePlan({
        workspaceId: workspace.id,
        status: WorkspacePlanStatuses.Valid,
        name: WorkspacePlans.Academia
      })
      const subscription = {
        billingInterval: BillingInterval.Monthly,
        totalEditorSeats: 20
      }

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          userId: cryptoRandomString({ length: 10 }),
          workspacePlan: plan,
          previousWorkspacePlan: plan,
          subscription,
          previousSubscription: subscription
        }
      })

      expect(events).to.have.lengthOf(0)
    })

    it('skips the plan updates of paid plans for PlanUpdate events as a subscription update event will be emitted', async () => {
      const events: MixpanelFakeEventRecord = []
      const userId = cryptoRandomString({ length: 10 })
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspacePlanUpdated,
        payload: {
          userId,
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.ProUnlimited
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Free
          })
        }
      })

      expect(events).to.have.lengthOf(0)
    })

    it('pushes an event on a subscription downscale (seats reduction on workspace)', async () => {
      const events: MixpanelFakeEventRecord = []
      const userId = cryptoRandomString({ length: 10 })
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          userId,
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Pro
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Pro
          }),
          subscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 15
          },
          previousSubscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 20
          }
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.eventName).to.be.eq(MixpanelEvents.EditorSeatsDownscaled)
      expect(event.workspaceId).to.be.eq(workspace.id)
      expect(event.payload).to.be.deep.eq({
        amount: 5, // 20 - 15
        planName: 'pro'
      })
    }),
      [
        WorkspacePlanStatuses.PaymentFailed,
        WorkspacePlanStatuses.CancelationScheduled,
        WorkspacePlanStatuses.Canceled
      ].forEach((status) => {
        it(`sends a canceled event to mixpanel on subscription ${status}`, async () => {
          const userId = cryptoRandomString({ length: 10 })
          const events: MixpanelFakeEventRecord = []
          const workspaceTracking = workspaceTrackingFactory({
            ...defaults,
            mixpanel: buildMixpanelFake({ events })
          })

          await workspaceTracking({
            eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
            payload: {
              userId,
              workspacePlan: buildTestWorkspacePlan({
                workspaceId: workspace.id,
                status
              }),
              previousWorkspacePlan: buildTestWorkspacePlan({
                workspaceId: workspace.id,
                status: WorkspacePlanStatuses.Valid
              }),
              subscription: {
                billingInterval: BillingInterval.Monthly,
                totalEditorSeats: 10
              },
              previousSubscription: {
                billingInterval: BillingInterval.Monthly,
                totalEditorSeats: 10
              }
            }
          })

          const event = events[0]
          expect(events).to.have.lengthOf(1)
          expect(event.eventName).to.be.eq(mapPlanStatusToMixpanelEvent[status])
          expect(event.workspaceId).to.be.eq(workspace.id)
        })
      })

    it("doesn't send anything to mixpanel on subscription update regarding the valid status upgrade", async () => {
      const events: MixpanelFakeEventRecord = []
      const userId = cryptoRandomString({ length: 10 })
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          userId,
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid
          }),
          subscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 10
          },
          previousSubscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 10
          }
        }
      })

      expect(events).to.have.lengthOf(0)
    })

    it('emits PlanUpgrade when a subscription changes a workspacePlan (and no SeatPurchase)', async () => {
      const events: MixpanelFakeEventRecord = []
      const userId = cryptoRandomString({ length: 10 })
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          userId,
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Team
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Free
          }),
          subscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 2
          },
          previousSubscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 1
          }
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.eventName).to.be.eq(MixpanelEvents.WorkspaceUpgraded)
      expect(event.workspaceId).to.be.eq(workspace.id)
      expect(event.payload).to.be.deep.eq({
        cycle: BillingInterval.Monthly,
        plan: WorkspacePlans.Team,
        previousPlan: WorkspacePlans.Free
      })
    })

    it('emits a SeatPurchase when a subscription increases quantity but keeps planName the same', async () => {
      const events: MixpanelFakeEventRecord = []
      const userId = cryptoRandomString({ length: 10 })
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          userId,
          workspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Team
          }),
          previousWorkspacePlan: buildTestWorkspacePlan({
            workspaceId: workspace.id,
            status: WorkspacePlanStatuses.Valid,
            name: WorkspacePlans.Team
          }),
          subscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 2
          },
          previousSubscription: {
            billingInterval: BillingInterval.Monthly,
            totalEditorSeats: 1
          }
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.eventName).to.be.eq(MixpanelEvents.EditorSeatsPurchased)
      expect(event.workspaceId).to.be.eq(workspace.id)
      expect(event.payload).to.be.deep.eq({
        amount: 1, // 2 - 1
        planName: 'team'
      })
    })

    it('sends a custom delete mixpanel event on Workspace Delete', async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: WorkspaceEvents.Deleted,
        payload: {
          workspaceId: workspace.id
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.eventName).to.be.eq(MixpanelEvents.WorkspaceDeleted)
      expect(event.workspaceId).to.be.eq(workspace.id)
    })

    it('sets the workspace properties as deleted in mixpanel on Workspace Deletetion', async () => {
      const events: MixpanelFakeEventRecord = []
      const groups: Record<string, { isDeleted: boolean }> = {}
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events, groups })
      })

      await workspaceTracking({
        eventName: WorkspaceEvents.Deleted,
        payload: {
          workspaceId: workspace.id
        }
      })

      const upatedWorkspaceProperties = groups[workspace.id]
      expect(upatedWorkspaceProperties).not.to.be.undefined
      expect(upatedWorkspaceProperties.isDeleted).to.be.true
    }),
      [
        {
          previousSeat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Viewer }),
          seat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Editor }),
          expectedEvent: MixpanelEvents.EditorSeatAssigned
        },
        {
          previousSeat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Editor }),
          seat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Viewer }),
          expectedEvent: MixpanelEvents.EditorSeatUnassigned
        },
        {
          previousSeat: undefined,
          seat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Viewer }),
          expectedEvent: undefined
        },
        {
          previousSeat: undefined,
          seat: buildTestWorkspaceSeat({ type: WorkspaceSeatType.Editor }),
          expectedEvent: MixpanelEvents.EditorSeatAssigned // creation
        }
      ].forEach(({ previousSeat, seat, expectedEvent }) => {
        const title = expectedEvent
          ? 'sends a ' + expectedEvent
          : ' does not send anything'

        it(`${title} on seat ${previousSeat?.type} changed to ${seat.type}`, async () => {
          const events: MixpanelFakeEventRecord = []
          const updatedByUserId = cryptoRandomString({ length: 10 })
          const workspaceTracking = workspaceTrackingFactory({
            ...defaults,
            mixpanel: buildMixpanelFake({ events })
          })

          await workspaceTracking({
            eventName: WorkspaceEvents.SeatUpdated,
            payload: {
              updatedByUserId,
              seat,
              previousSeat
            }
          })

          if (!expectedEvent) {
            expect(events).to.have.lengthOf(0)
            return
          }

          const event = events[0]
          expect(events).to.have.lengthOf(1)
          expect(event.eventName).to.be.eq(expectedEvent)
          expect(event.workspaceId).to.be.eq(seat.workspaceId)
          expect(event.userEmail).to.be.eq(user.email)
        })
      })
  }
)
