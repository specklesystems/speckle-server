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
        <UserAvatarGroup :users="project.team" class="max-w-[104px]" />
        <div>
          <FormButton class="ml-2">
            {{ project.role === 'stream:owner' ? 'Manage' : 'View' }}
          </FormButton>
        </div>
      </div>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/20/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'
import { PlusIcon } from '@heroicons/vue/24/solid'

graphql(`
  fragment ProjectPageStatsBlockTeam on Project {
    role
    team {
      id
      name
      avatar
    }
    role
  }
`)

defineProps<{
  project: ProjectPageStatsBlockTeamFragment
}>()
</script>
