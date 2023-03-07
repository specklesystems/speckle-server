import { Roles } from '@speckle/shared'
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

  const collaboratorListItems = computed((): ProjectCollaboratorListItem[] => {
    const results: ProjectCollaboratorListItem[] = []

    for (const invitedUser of project.value.invitedTeam || []) {
      results.push({
        id: invitedUser.id,
        title: invitedUser.title,
        user: invitedUser.user || null,
        role: invitedUser.role,
        inviteId: invitedUser.inviteId
      })
    }

    for (const collaborator of project.value.team) {
      results.push({
        id: collaborator.user.id,
        title: collaborator.user.name,
        user: collaborator.user,
        role: collaborator.role,
        inviteId: null
      })
    }

    return results
  })

  const isOwner = computed(() => project.value.role === Roles.Stream.Owner)

  return {
    collaboratorListItems,
    isOwner
  }
}
