import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  WorkspaceMixpanelUpdateGroup_WorkspaceFragment,
  WorkspaceMixpanelUpdateGroup_WorkspaceCollaboratorFragment
} from '~/lib/common/generated/gql/graphql'
import { Roles, type WorkspaceRoles } from '@speckle/shared'
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
    billing {
      cost {
        total
      }
      versionsCount {
        current
        max
      }
    }
    team {
      totalCount
      items {
        ...WorkspaceMixpanelUpdateGroup_WorkspaceCollaborator
      }
    }
  }
`)

export const useWorkspacesMixpanel = () => {
  const mixpanel = useMixpanel()

  const workspaceMixpanelUpdateGroup = (
    workspace: WorkspaceMixpanelUpdateGroup_WorkspaceFragment
  ) => {
    if (!workspace.id) return
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
      ...(import.meta.client && {
        // eslint-disable-next-line camelcase
        server_id: resolveMixpanelServerId(window.location.hostname)
      }),
      ...(workspace.billing && {
        costTotal: workspace.billing.cost.total,
        versionsCountCurrent: workspace.billing.versionsCount.current,
        versionsCountMax: workspace.billing.versionsCount.max
      })
    }

    mixpanel.get_group('workspace_id', workspace.id).set(input)
  }

  return {
    workspaceMixpanelUpdateGroup
  }
}
