import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMixpanelUpdateGroup_WorkspaceFragment,
  WorkspaceMixpanelUpdateGroup_WorkspaceCollaboratorFragment,
  PaidWorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { type MaybeNullOrUndefined, Roles, type WorkspaceRoles } from '@speckle/shared'
import { resolveMixpanelServerId } from '@speckle/shared'
import { WorkspacePlanStatuses } from '~/lib/common/generated/gql/graphql'
import { isPaidPlan } from '@/lib/billing/helpers/types'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'

graphql(`
  fragment WorkspaceMixpanelUpdateGroup_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    role
  }
`)

graphql(`
  fragment WorkspaceMixpanelUpdateGroup_Workspace on Workspace {
    id
    name
    description
    domainBasedMembershipProtectionEnabled
    discoverabilityEnabled
    plan {
      status
      name
      createdAt
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
      seats {
        guest
        plan
      }
    }
    team {
      totalCount
      items {
        ...WorkspaceMixpanelUpdateGroup_WorkspaceCollaborator
      }
    }
    defaultRegion {
      key
    }
  }
`)

export const useWorkspacesMixpanel = () => {
  const mixpanel = useMixpanel()

  const workspaceMixpanelUpdateGroup = (
    workspace: WorkspaceMixpanelUpdateGroup_WorkspaceFragment,
    userEmail: MaybeNullOrUndefined<string>
  ) => {
    if (!workspace.id || !import.meta.client) return

    const getEstimatedBill = () => {
      if (
        !isPaidPlan(workspace.plan?.name) ||
        workspace.plan?.status !== WorkspacePlanStatuses.Valid ||
        !workspace.subscription?.billingInterval
      )
        return 0

      const planConfig =
        pricingPlansConfig.plans[workspace.plan.name as unknown as PaidWorkspacePlans]
      const cost = planConfig.cost[workspace.subscription.billingInterval]

      const memberPrice = cost[Roles.Workspace.Member]
      const guestPrice = cost[Roles.Workspace.Guest]
      const memberCount = workspace.subscription?.seats?.plan || 0
      const guestCount = workspace.subscription?.seats?.guest || 0

      return memberPrice * memberCount + guestPrice * guestCount
    }

    const roleCount = {
      [Roles.Workspace.Admin]: 0,
      [Roles.Workspace.Member]: 0,
      [Roles.Workspace.Guest]: 0
    }

    workspace.team.items.forEach(
      (item: WorkspaceMixpanelUpdateGroup_WorkspaceCollaboratorFragment) => {
        roleCount[item.role as WorkspaceRoles] =
          (roleCount[item.role as WorkspaceRoles] ?? 0) + 1
      }
    )

    const input = {
      name: workspace.name,
      description: workspace.description,
      domainBasedMembershipProtectionEnabled:
        workspace.domainBasedMembershipProtectionEnabled,
      discoverabilityEnabled: workspace.discoverabilityEnabled,
      teamTotalCount: workspace.team.totalCount,
      teamAdminCount: roleCount[Roles.Workspace.Admin],
      teamMemberCount: roleCount[Roles.Workspace.Member],
      teamGuestCount: roleCount[Roles.Workspace.Guest],
      defaultRegionKey: workspace.defaultRegion?.key,
      planName: workspace.plan?.name || '',
      planStatus: workspace.plan?.status || '',
      planCreatedAt: workspace.plan?.createdAt,
      subscriptionBillingInterval: workspace.subscription?.billingInterval,
      subscriptionCurrentBillingCycleEnd:
        workspace.subscription?.currentBillingCycleEnd,
      seats: workspace.subscription?.seats?.plan || 0,
      seatsGuest: workspace.subscription?.seats?.guest || 0,
      estimatedBill: getEstimatedBill(),
      // eslint-disable-next-line camelcase
      server_id: resolveMixpanelServerId(window.location.hostname)
    }

    mixpanel.get_group('workspace_id', workspace.id).set(input)

    if (userEmail?.includes('speckle.systems')) {
      mixpanel.get_group('workspace_id', workspace.id).set_once({
        hasSpeckleMembers: true
      })
    }
  }

  return {
    workspaceMixpanelUpdateGroup
  }
}
