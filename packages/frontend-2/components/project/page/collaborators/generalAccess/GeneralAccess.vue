<template>
  <div>
    <ProjectPageCollaboratorsGeneralAccessAdmins :admins="admins" :can-edit="canEdit" />
    <ProjectPageCollaboratorsGeneralAccessMembers
      :workspace-id="workspaceId"
      :can-edit="canEdit"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ProjectPageCollaborators_WorkspaceCollaboratorFragment } from '~~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment ProjectPageCollaborators_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    user {
      id
      name
      avatar
    }
  }
`)

defineProps<{
  canEdit: boolean
  admins: ProjectPageCollaborators_WorkspaceCollaboratorFragment[]
  workspaceId: MaybeNullOrUndefined<string>
}>()
</script>
