<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-1 flex-grow select-none">
            <span class="text-foreground text-sm font-semibold">Collaborators</span>
          </div>
          <div class="flex items-center text-sm capitalize">
            {{ project.role?.split(':').reverse()[0] }}
          </div>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-1">
        <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
        <div v-if="canEdit">
          <FormButton class="ml-2" :to="projectCollaboratorsRoute(project.id)">
            Manage
          </FormButton>
        </div>
      </div>
    </template>
  </ProjectPageStatsBlock>
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
