import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import type {
  GetWorkspacePlan,
  GetWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { calculateSubscriptionSeats } from '@/modules/gatekeeper/domain/billing'
import type { MixpanelClient } from '@/modules/shared/utils/mixpanel'
import {
  getBaseTrackingProperties,
  WORKSPACE_TRACKING_ID_KEY
} from '@/modules/shared/utils/mixpanel'
import type {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetDefaultRegion,
  GetWorkspaceModelCount,
  GetWorkspacesProjectsCounts,
  GetWorkspaceSeatCount,
  GetAllWorkspaces
} from '@/modules/workspaces/domain/operations'
import type { Workspace } from '@/modules/workspacesCore/domain/types'
import type { Logger } from '@/observability/logging'
import type { Nullable } from '@speckle/shared'
import { Roles, SeatTypes } from '@speckle/shared'
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
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { getExplicitProjects } from '@/modules/core/repositories/streams'
import { queryAllProjectsFactory } from '@/modules/core/services/projects'

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
      seatsEditorCount,
      seatsViewerCount,
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
      planUpdatedAt: plan?.updatedAt || null,
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
      lastSyncAt: new Date(),
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
    mixpanel: MixpanelClient
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

    const buildPropertiesAndPushThenToMixpanel = async (workspace: Workspace) => {
      mixpanel.groups.set(
        WORKSPACE_TRACKING_ID_KEY,
        workspace.id,
        await buildWorkspaceTrackingProperties(workspace)
      )
    }

    const MAX_ITERATIONS = 10_000
    let cursor = null
    let items = []
    let iterationCount = 0
    do {
      if (iterationCount++ >= MAX_ITERATIONS) {
        logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
        break
      }

      const batchedWorkspaces = await deps.getAllWorkspaces({ cursor, limit: 25 })
      cursor = batchedWorkspaces.cursor
      items = batchedWorkspaces.items

      await Promise.all(items.map(buildPropertiesAndPushThenToMixpanel))
    } while (cursor && items.length)

    logger.info('Finished full workspace tracking update')
  }

export const scheduleUpdateAllWorkspacesTracking = ({
  scheduleExecution,
  mixpanel
}: {
  scheduleExecution: ScheduleExecution
  mixpanel: MixpanelClient
}) => {
  const updateAllWorkspacesTackingProperties =
    updateAllWorkspacesTackingPropertiesFactory({
      countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
      getDefaultRegion: getDefaultRegionFactory({ db }),
      getWorkspacePlan: getWorkspacePlanFactory({ db }),
      getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
      getWorkspaceModelCount: getWorkspaceModelCountFactory({
        queryAllProjects: queryAllProjectsFactory({
          getExplicitProjects: getExplicitProjects({ db })
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
