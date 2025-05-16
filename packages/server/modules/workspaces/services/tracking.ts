import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import {
  calculateSubscriptionSeats,
  GetWorkspacePlan,
  GetWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { getBaseTrackingProperties } from '@/modules/shared/utils/mixpanel'
import {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetDefaultRegion,
  GetWorkspaceModelCount,
  GetWorkspacesProjectsCounts,
  GetWorkspaceSeatCount,
  GetAllWorkspaces
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Logger } from '@/observability/logging'
import { Nullable, Roles, SeatTypes } from '@speckle/shared'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getAllWorkspacesFactory,
  getWorkspaceSeatCountFactory,
  getWorkspacesProjectsCountsFactory
} from '@/modules/workspaces/repositories/workspaces'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import { db } from '@/db/knex'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { Mixpanel } from 'mixpanel'

export const WORKSPACE_TRACKING_ID_KEY = 'workspace_id'

export type WorkspaceTrackingProperties = {
  name: string
  description: Nullable<string>
  domainBasedMembershipProtectionEnabled: boolean
  discoverabilityEnabled: boolean
  defaultRegionKey: Nullable<string>
  teamTotalCount: number
  teamAdminCount: number
  teamMemberCount: number
  teamGuestCount: number
  planName: string
  planStatus: string
  planCreatedAt: Nullable<Date>
  subscriptionCreatedAt: Nullable<Date>
  subscriptionBillingInterval: Nullable<string>
  subscriptionCurrentBillingCycleEnd: Nullable<Date>
  seats: number
  seatsGuest: number
  seatsViewerCount: number
  seatsEditorCount: number
  createdAt: Date
  projectCount: number
  modelCount: number
}

export const buildWorkspaceTrackingPropertiesFactory =
  (deps: {
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getDefaultRegion: GetDefaultRegion
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getWorkspaceModelCount: GetWorkspaceModelCount
    getWorkspacesProjectCount: GetWorkspacesProjectsCounts
    getWorkspaceSeatCount: GetWorkspaceSeatCount
  }): ((workpsace: Workspace) => Promise<WorkspaceTrackingProperties>) =>
  async (workspace) => {
    const workspaceId = workspace.id
    const [
      adminCount,
      memberCount,
      guestCount,
      seatsViewerCount,
      seatsEditorCount,
      defaultRegion,
      plan,
      subscription,
      workspacesProjectCount,
      modelCount
    ] = await Promise.all([
      deps.countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Admin }),
      deps.countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Member }),
      deps.countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Guest }),
      deps.getWorkspaceSeatCount({ workspaceId, type: SeatTypes.Editor }),
      deps.getWorkspaceSeatCount({ workspaceId, type: SeatTypes.Viewer }),
      deps.getDefaultRegion({ workspaceId }),
      deps.getWorkspacePlan({ workspaceId }),
      deps.getWorkspaceSubscription({ workspaceId }),
      deps.getWorkspacesProjectCount({ workspaceIds: [workspaceId] }),
      deps.getWorkspaceModelCount({ workspaceId })
    ])

    let seats = 0
    let subscriptionBillingInterval = null
    let subscriptionCurrentBillingCycleEnd = null
    let subscriptionCreatedAt = null

    if (subscription !== null) {
      seats = calculateSubscriptionSeats({
        subscriptionData: subscription.subscriptionData
      })

      subscriptionBillingInterval = subscription.billingInterval
      subscriptionCurrentBillingCycleEnd = subscription.currentBillingCycleEnd
      subscriptionCreatedAt = subscription.createdAt
    }

    return {
      name: workspace.name,
      description: workspace.description,
      domainBasedMembershipProtectionEnabled:
        workspace.domainBasedMembershipProtectionEnabled,
      discoverabilityEnabled: workspace.discoverabilityEnabled,
      defaultRegionKey: defaultRegion?.key || null,
      teamTotalCount: adminCount + memberCount + guestCount,
      teamAdminCount: adminCount,
      teamMemberCount: memberCount,
      teamGuestCount: guestCount,
      planName: plan?.name || '',
      planStatus: plan?.status || '',
      planCreatedAt: plan?.createdAt || null,
      subscriptionCreatedAt,
      subscriptionBillingInterval,
      subscriptionCurrentBillingCycleEnd,
      seats,
      seatsGuest: 0,
      seatsViewerCount,
      seatsEditorCount,
      createdAt: workspace.createdAt,
      projectCount: workspacesProjectCount[workspace.id] || 0,
      modelCount,
      ...getBaseTrackingProperties()
    }
  }

export const updateAllWorkspacesTackingPropertiesFactory =
  (deps: {
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getDefaultRegion: GetDefaultRegion
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getWorkspaceModelCount: GetWorkspaceModelCount
    getWorkspacesProjectCount: GetWorkspacesProjectsCounts
    getWorkspaceSeatCount: GetWorkspaceSeatCount
    getAllWorkspaces: GetAllWorkspaces
  }): (({
    logger,
    mixpanel
  }: {
    logger: Logger
    mixpanel: Mixpanel
  }) => Promise<void>) =>
  async ({ logger, mixpanel }) => {
    logger.info('Start full workspace tracking update')

    const buildWorkspaceTrackingProperties = buildWorkspaceTrackingPropertiesFactory({
      countWorkspaceRole: deps.countWorkspaceRole,
      getDefaultRegion: deps.getDefaultRegion,
      getWorkspacePlan: deps.getWorkspacePlan,
      getWorkspaceSubscription: deps.getWorkspaceSubscription,
      getWorkspaceModelCount: deps.getWorkspaceModelCount,
      getWorkspacesProjectCount: deps.getWorkspacesProjectCount,
      getWorkspaceSeatCount: deps.getWorkspaceSeatCount
    })

    const bultPropertiesAndPushThenToMixpanel = async (workspace: Workspace) => {
      mixpanel.groups.set(
        WORKSPACE_TRACKING_ID_KEY,
        workspace.id,
        await buildWorkspaceTrackingProperties(workspace)
      )
    }

    let cursor = null
    let items = []
    do {
      const batchedWorkspaces = await deps.getAllWorkspaces({ cursor, limit: 25 })
      cursor = batchedWorkspaces.cursor
      items = batchedWorkspaces.items

      await Promise.all(items.map(bultPropertiesAndPushThenToMixpanel))
    } while (cursor && items.length)

    logger.info('Finished full workspace tracking update')
  }

export const scheduleUpdateAllWorkspacesTracking = ({
  scheduleExecution,
  mixpanel
}: {
  scheduleExecution: ScheduleExecution
  mixpanel: Mixpanel
}) => {
  const updateAllWorkspacesTackingProperties =
    updateAllWorkspacesTackingPropertiesFactory({
      countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
      getDefaultRegion: getDefaultRegionFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
      getWorkspaceModelCount: getWorkspaceModelCountFactory({
        queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
          getStreams: legacyGetStreamsFactory({ db })
        }),
        getPaginatedProjectModelsTotalCount: getPaginatedProjectModelsTotalCountFactory(
          {
            db
          }
        )
      }),
      getWorkspacesProjectCount: getWorkspacesProjectsCountsFactory({ db }),
      getWorkspaceSeatCount: getWorkspaceSeatCountFactory({ db }),
      getAllWorkspaces: getAllWorkspacesFactory({ db })
    })

  const dailyAt2AM = '0 2 * * *'
  return scheduleExecution(
    dailyAt2AM,
    'UpdateWorkspacestracking',
    async (_scheduledTime, { logger }) =>
      await updateAllWorkspacesTackingProperties({ logger, mixpanel })
  )
}
