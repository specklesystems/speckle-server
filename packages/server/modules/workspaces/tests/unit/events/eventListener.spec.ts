import { workspaceTrackingFactory } from '@/modules/workspaces/events/eventListener'
import { buildBasicTestUser } from '@/test/authHelper'
import { buildTestWorkspaceWithOptionalRole } from '@/modules/workspaces/tests/helpers/creation'
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
  GetWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  FindEmailsByUserId,
  FindPrimaryEmailForUser
} from '@/modules/core/domain/userEmails/operations'
import {
  buildMixpanelFake,
  MixpanelFakeEventRecord
} from '@/modules/shared/test/helpers/mixpanel'
import { getFeatureFlags } from '@speckle/shared/environment'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import { MixpanelEvents } from '@/modules/shared/utils/mixpanel'
import { expect } from 'chai'
import { WORKSPACE_TRACKING_ID_KEY } from '@/modules/workspaces/services/tracking'
import { WorkspacePlanStatuses } from '@speckle/shared'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
  'workspaceTrackingFactory creates a function, that @workspaceEventListener',
  () => {
    const workspace = buildTestWorkspaceWithOptionalRole()
    const user = buildBasicTestUser()
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
    const baseTrackingProperties = {
      // eslint-disable-next-line camelcase
      server_id: 'tracking_server_id',
      speckleVersion: 'test',
      hostApp: 'serverside'
    }

    const workspacePlan = buildTestWorkspacePlan({ workspaceId: workspace.id })
    const workspaceSubscribtion = buildTestWorkspaceSubscription({
      workspaceId: workspace.id
    })

    const getWorkspace: GetWorkspace = async () => workspace
    const countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole = async () => 0
    const getDefaultRegion: GetDefaultRegion = async () => region
    const getWorkspacePlan: GetWorkspacePlan = async () => workspacePlan
    const getWorkspaceSubscription: GetWorkspaceSubscription = async () =>
      workspaceSubscribtion
    const findPrimaryEmailForUser: FindPrimaryEmailForUser = async () => email
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
      findPrimaryEmailForUser,
      getUserEmails,
      getWorkspaceModelCount,
      getWorkspacesProjectCount,
      getWorkspaceSeatCount,
      getServerTrackingProperties: () => baseTrackingProperties
    }

    it('pushes a Mixpanel Upgrade event when workspace plan was upgraded', async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspacePlanUpdated,
        payload: {
          workspacePlan: {
            workspaceId: workspacePlan.workspaceId,
            name: workspacePlan.name,
            status: workspacePlan.status,
            previousPlanName: 'free'
          }
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.event).to.be.eq(MixpanelEvents.WorkspaceUpgraded)
      expect(event.payload).to.be.deep.eq({
        [WORKSPACE_TRACKING_ID_KEY]: workspace.id,
        plan: workspacePlan.name,
        cycle: workspaceSubscribtion.billingInterval,
        previousPlan: 'free',
        hostApp: 'serverside',
        speckleVersion: 'test',
        // eslint-disable-next-line camelcase
        server_id: 'tracking_server_id'
      })
    }),
      [WorkspacePlanStatuses.PaymentFailed, WorkspacePlanStatuses.Valid].forEach(
        (status) => {
          it(`does not send anything to mixpanel on subscription update regarding the status ${status}`, async () => {
            const events: MixpanelFakeEventRecord = []
            const workspaceTracking = workspaceTrackingFactory({
              ...defaults,
              mixpanel: buildMixpanelFake({ events })
            })

            await workspaceTracking({
              eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
              payload: {
                workspaceId: workspace.id,
                status
              }
            })

            expect(events).to.have.lengthOf(0)
          })
        }
      )

    it(`sends a canceled event to mixpanel on subscription cancelation`, async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          workspaceId: workspace.id,
          status: WorkspacePlanStatuses.Canceled
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.event).to.be.eq(MixpanelEvents.WorkspaceSubscriptionCanceled)
      expect(event.payload).to.be.deep.eq({
        [WORKSPACE_TRACKING_ID_KEY]: workspace.id,
        hostApp: 'serverside',
        speckleVersion: 'test',
        // eslint-disable-next-line camelcase
        server_id: 'tracking_server_id'
      })
    })

    it(`sends a CancelSchedule event to mixpanel when a subscription is scheduled to be canceled`, async () => {
      const events: MixpanelFakeEventRecord = []
      const workspaceTracking = workspaceTrackingFactory({
        ...defaults,
        mixpanel: buildMixpanelFake({ events })
      })

      await workspaceTracking({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          workspaceId: workspace.id,
          status: WorkspacePlanStatuses.CancelationScheduled
        }
      })

      const event = events[0]
      expect(events).to.have.lengthOf(1)
      expect(event.event).to.be.eq(
        MixpanelEvents.WorkspaceSubscriptionCancelationScheduled
      )
      expect(event.payload).to.be.deep.eq({
        [WORKSPACE_TRACKING_ID_KEY]: workspace.id,
        hostApp: 'serverside',
        speckleVersion: 'test',
        // eslint-disable-next-line camelcase
        server_id: 'tracking_server_id'
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
      expect(event.event).to.be.eq(MixpanelEvents.WorkspaceDeleted)
      expect(event.payload).to.be.deep.eq({
        [WORKSPACE_TRACKING_ID_KEY]: workspace.id,
        hostApp: 'serverside',
        speckleVersion: 'test',
        // eslint-disable-next-line camelcase
        server_id: 'tracking_server_id'
      })
    })
  }
)
