import { Roles } from '@speckle/shared'
import type { Nullable, ServerRoles, WorkspaceRoles } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql/gql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type {
  ProjectPageTeamInternals_ProjectFragment,
  ProjectPageTeamInternals_WorkspaceFragment,
  ProjectsPageTeamDialogManagePermissions_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import type { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'

graphql(`
  fragment ProjectPageTeamInternals_Project on Project {
    id
    role
    invitedTeam {
      id
      title
      role
      inviteId
      user {
        role
        ...LimitedUserAvatar
      }
    }
    team {
      role
      user {
        id
        role
        ...LimitedUserAvatar
      }
    }
  }
`)

graphql(`
  fragment ProjectPageTeamInternals_Workspace on Workspace {
    id
    team {
      items {
        id
        role
        user {
          id
        }
      }
    }
  }
`)

export function useTeamManagePermissionsInternals(
  project: Ref<
    | ProjectsPageTeamDialogManagePermissions_ProjectFragment
    | ProjectPageTeamInternals_ProjectFragment
    | undefined
  >
) {
  const { isGuest: isServerGuest, activeUser } = useActiveUser()

  const isOwner = computed(() => project.value?.role === Roles.Stream.Owner)

  return {
    activeUser,
    isOwner,
    isServerGuest
  }
}

export function useTeamInternals(
  projectData: ComputedRef<ProjectPageTeamInternals_ProjectFragment | undefined>,
  workspace?: Ref<ProjectPageTeamInternals_WorkspaceFragment | undefined>
) {
  const { isOwner, activeUser, isServerGuest } =
    useTeamManagePermissionsInternals(projectData)

  const collaboratorListItems = computed((): ProjectCollaboratorListItem[] => {
    const results: ProjectCollaboratorListItem[] = []

    for (const invitedUser of projectData.value?.invitedTeam || []) {
      results.push({
        id: invitedUser.id,
        title: invitedUser.title,
        user: invitedUser.user || null,
        role: invitedUser.role,
        inviteId: invitedUser.inviteId,
        serverRole: (invitedUser.user?.role || null) as Nullable<ServerRoles>,
        workspaceRole: null
      })
    }

    for (const collaborator of projectData.value?.team ?? []) {
      const workspaceRole = workspace?.value?.team?.items.find(
        (role) => role.user.id === collaborator.user.id
      )?.role

      results.push({
        id: collaborator.user.id,
        title: collaborator.user.name,
        user: collaborator.user,
        role: collaborator.role,
        inviteId: null,
        serverRole: collaborator.user.role as ServerRoles,
        workspaceRole: workspaceRole as WorkspaceRoles
      })
    }

    return results.sort((a, b) => {
      const leftIsAdmin = a.workspaceRole === Roles.Workspace.Admin
      const rightIsAdmin = b.workspaceRole === Roles.Workspace.Admin

      return Number(rightIsAdmin) - Number(leftIsAdmin)
    })
  })

  const canLeaveProject = computed(() => {
    if (!activeUser.value || !projectData.value?.role) {
      return false
    }

    const userId = activeUser.value.id
    const owners = projectData.value.team.filter((t) => t.role === Roles.Stream.Owner)
    return owners.length !== 1 || owners[0].user.id !== userId
  })

  return {
    collaboratorListItems,
    isOwner,
    canLeaveProject,
    isServerGuest
  }
}
