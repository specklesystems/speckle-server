<template>
  <div class="flex gap-x-4 items-center">
    <p class="text-body-2xs text-foreground-2 capitalize">
      {{ project.role?.split(':').reverse()[0] }}
    </p>
    <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
    <FormButton
      v-if="canEdit"
      color="outline"
      :to="projectCollaboratorsRoute(project.id)"
    >
      Manage
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import { canEditProject } from '~~/lib/projects/helpers/permissions'
import type { ProjectPageTeamInternals_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { projectCollaboratorsRoute } from '~~/lib/common/helpers/route'

const props = defineProps<{
  project: ProjectPageTeamInternals_ProjectFragment
}>()

const canEdit = computed(() => canEditProject(props.project))

const teamUsers = computed(() => props.project.team.map((t) => t.user))
</script>
