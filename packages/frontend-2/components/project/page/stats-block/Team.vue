<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex items-center">
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center flex-grow">
            <UsersIcon class="h-5 w-5" />
            <span class="text-xs">Team</span>
          </div>
          <div class="text-xs">{{ project.role?.split(':').reverse()[0] }}</div>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-2">
        <UserAvatarGroup :users="teamUsers" class="max-w-[104px]" />
        <div>
          <FormButton class="ml-2" @click="dialogOpen = true">
            {{ project.role === 'stream:owner' ? 'Manage' : 'View' }}
          </FormButton>
        </div>
      </div>
    </template>
    <template #default>
      <ProjectPageTeamDialog v-model:open="dialogOpen" :project="project" />
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/20/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockTeam on Project {
    id
    role
    team {
      role
      user {
        ...LimitedUserAvatar
      }
    }
    ...ProjectPageTeamDialog
  }
`)

const props = defineProps<{
  project: ProjectPageStatsBlockTeamFragment
}>()

const dialogOpen = ref(false)

const teamUsers = computed(() => props.project.team.map((t) => t.user))
</script>
