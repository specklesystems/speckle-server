<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-1 flex-grow select-none">
            <span class="text-foreground text-sm font-semibold">Collaborators</span>
          </div>
          <div class="flex items-center text-sm">
            {{ project.role?.split(':').reverse()[0] }}
          </div>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-1">
        <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
        <div v-if="activeUser">
          <FormButton class="ml-2" :icon-left="UserPlusIcon" @click="onButtonClick">
            Invite
          </FormButton>
        </div>
      </div>
    </template>
    <template #default>
      <ProjectPageInviteDialog
        v-model:open="dialogOpen"
        :project="project"
        :project-id="project.id"
        :disabled="!isOwner"
      />
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { UserPlusIcon } from '@heroicons/vue/24/outline'
import { useTeamInternals } from '~/lib/projects/composables/team'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import type { ProjectPageTeamInternals_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  project: ProjectPageTeamInternals_ProjectFragment
}>()

const { activeUser } = useActiveUser()

const projectData = computed(() => props.project)

const { isOwner } = useTeamInternals(projectData)

const dialogOpen = ref(false)

const teamUsers = computed(() => props.project.team.map((t) => t.user))

const onButtonClick = () => {
  dialogOpen.value = true
}
</script>
