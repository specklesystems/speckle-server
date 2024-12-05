import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMixpanelUpdateGroup_WorkspaceFragment,
  WorkspaceMixpanelUpdateGroup_WorkspaceCollaboratorFragment
} from '~/lib/common/generated/gql/graphql'
import { type MaybeNullOrUndefined, Roles, type WorkspaceRoles } from '@speckle/shared'
import { resolveMixpanelServerId } from '@speckle/shared'

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

      // eslint-disable-next-line camelcase
      server_id: resolveMixpanelServerId(window.location.hostname),
      planName: workspace.plan?.name || '',
      planStatus: workspace.plan?.status || '',
      planCreatedAt: workspace.plan?.createdAt,
      subscriptionBillingInterval: workspace.subscription?.billingInterval,
      subscriptionCurrentBillingCycleEnd: workspace.subscription?.currentBillingCycleEnd
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
