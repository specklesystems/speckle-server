<template>
  <div class="mt-4">
    <ProjectVisibilitySelect
      v-model="currentVisibility"
      :disabled="isDisabled"
      :workspace-id="project.workspaceId"
      mount-menu-on-body
    />
  </div>
</template>

<script setup lang="ts">
import type { ProjectsPageTeamDialogManagePermissions_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { useTeamManagePermissionsInternals } from '~~/lib/projects/composables/team'
import { graphql } from '~~/lib/common/generated/gql/gql'
import {
  castToSupportedVisibility,
  type SupportedProjectVisibility
} from '~/lib/projects/helpers/visibility'

graphql(`
  fragment ProjectsPageTeamDialogManagePermissions_Project on Project {
    id
    visibility
    role
    workspaceId
  }
`)

const props = defineProps<{
  project: ProjectsPageTeamDialogManagePermissions_ProjectFragment
}>()

const emit = defineEmits<{
  (e: 'changedVisibility', newVisibility: SupportedProjectVisibility): void
}>()

const projectRef = toRef(props, 'project')
const { isOwner, isServerGuest } = useTeamManagePermissionsInternals(projectRef)

const isDisabled = computed(() => !isOwner.value || isServerGuest.value)

const currentVisibility = ref(castToSupportedVisibility(props.project.visibility))

watch(currentVisibility, (newVisibility) => {
  emit('changedVisibility', newVisibility)
})
</script>
