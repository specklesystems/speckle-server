<template>
  <div class="mt-4">
    <ProjectVisibilitySelect
      v-model="currentVisibility"
      :disabled="isDisabled"
      mount-menu-on-body
    />
  </div>
</template>

<script setup lang="ts">
import type {
  ProjectsPageTeamDialogManagePermissions_ProjectFragment,
  SimpleProjectVisibility
} from '~~/lib/common/generated/gql/graphql'
import { useTeamManagePermissionsInternals } from '~~/lib/projects/composables/team'
import { graphql } from '~~/lib/common/generated/gql/gql'

graphql(`
  fragment ProjectsPageTeamDialogManagePermissions_Project on Project {
    id
    visibility
    role
  }
`)

const props = defineProps<{
  project: ProjectsPageTeamDialogManagePermissions_ProjectFragment
}>()

const emit = defineEmits<{
  (e: 'changedVisibility', newVisibility: SimpleProjectVisibility): void
}>()

const projectRef = toRef(props, 'project')
const { isOwner, isServerGuest } = useTeamManagePermissionsInternals(projectRef)

const isDisabled = computed(() => !isOwner.value || isServerGuest.value)

const currentVisibility = ref(props.project.visibility)

watch(currentVisibility, (newVisibility) => {
  emit('changedVisibility', newVisibility)
})
</script>
