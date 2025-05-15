import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import {
  calculateSubscriptionSeats,
  GetWorkspacePlan,
  GetWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { getBaseTrackingProperties, getClient } from '@/modules/shared/utils/mixpanel'
import {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetDefaultRegion,
  GetWorkspaceModelCount,
  GetWorkspacesProjectsCounts,
  GetWorkspaceSeatCount
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Logger } from '@/observability/logging'
import { Nullable, Roles, SeatTypes } from '@speckle/shared'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
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
import { assign } from 'lodash'

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

export const updateWorkspacesTackingPropertiesFactory =
  (deps: {
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getDefaultRegion: GetDefaultRegion
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getWorkspaceModelCount: GetWorkspaceModelCount
    getWorkspacesProjectCount: GetWorkspacesProjectsCounts
    getWorkspaceSeatCount: GetWorkspaceSeatCount
  }): (({ logger }: { logger: Logger }) => Promise<void>) =>
  ({ logger }) => {
    const mixpanel = getClient()
    if (!mixpanel) return Promise.resolve()

    assign({}, deps)
    logger.info('Starting batch tracking update')

    // TODO: get bached workspaces
    // buildWorkspaceTrackingProperties and push them to mixpanel
    // iterate untill the end

    return Promise.resolve()
  }

export const scheduleUpdateWorkspacesTracking = ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const updateWorkspacesTackingProperties = updateWorkspacesTackingPropertiesFactory({
    countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
    getDefaultRegion: getDefaultRegionFactory({ db }),
    getWorkspacePlan: getWorkspacePlanFactory({ db }),
    getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
    getWorkspaceModelCount: getWorkspaceModelCountFactory({
      queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
        getStreams: legacyGetStreamsFactory({ db })
      }),
      getPaginatedProjectModelsTotalCount: getPaginatedProjectModelsTotalCountFactory({
        db
      })
    }),
    getWorkspacesProjectCount: getWorkspacesProjectsCountsFactory({ db }),
    getWorkspaceSeatCount: getWorkspaceSeatCountFactory({ db })
  })

  const at2AMonMondaysAndSubdays = '0 2 * * 0,3'
  return scheduleExecution(
    at2AMonMondaysAndSubdays,
    'UpdateWorkspacestracking',
    async (_scheduledTime, { logger }) =>
      await updateWorkspacesTackingProperties({ logger })
  )
}
