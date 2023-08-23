import { Nullable, Roles, ServerRoles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { ProjectCollaboratorListItem } from '~~/lib/projects/helpers/components'

export function useTeamDialogInternals(params: {
  props: {
    project: Ref<ProjectPageTeamDialogFragment>
  }
}) {
  const {
    props: { project }
  } = params

  const { activeUser, isGuest: isServerGuest } = useActiveUser()

  const collaboratorListItems = computed((): ProjectCollaboratorListItem[] => {
    const results: ProjectCollaboratorListItem[] = []

    for (const invitedUser of project.value.invitedTeam || []) {
      results.push({
        id: invitedUser.id,
        title: invitedUser.title,
        user: invitedUser.user || null,
        role: invitedUser.role,
        inviteId: invitedUser.inviteId,
        serverRole: (invitedUser.user?.role || null) as Nullable<ServerRoles>
      })
    }

    for (const collaborator of project.value.team) {
      results.push({
        id: collaborator.user.id,
        title: collaborator.user.name,
        user: collaborator.user,
        role: collaborator.role,
        inviteId: null,
        serverRole: collaborator.user.role as ServerRoles
      })
    }

    return results
  })

  const isOwner = computed(() => project.value.role === Roles.Stream.Owner)

  const canLeaveProject = computed(() => {
    if (!activeUser.value) return false
    if (!project.value.role) return false

    const userId = activeUser.value.id
    const owners = project.value.team.filter((t) => t.role === Roles.Stream.Owner)
    return owners.length !== 1 || owners[0].user.id !== userId
  })

  return {
    collaboratorListItems,
    isOwner,
    canLeaveProject,
    isServerGuest
  }
}
