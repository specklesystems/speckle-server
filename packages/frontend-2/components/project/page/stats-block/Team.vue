<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-1.5">
          <UsersIcon class="h-5 w-5" />
          <span class="text-xs">Team</span>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex items-center justify-between mt-2">
        <div v-if="project.team.length" class="flex -space-x-3">
          <UserAvatar
            v-for="user in project.team.slice(0, 3)"
            :key="user.id"
            :user="user"
            :avatar-url="user.avatar"
            size="lg"
          />
          <UserAvatar v-if="project.team.length > 3" size="lg">
            +{{ project.team.length - 3 }}
          </UserAvatar>
        </div>
        <div class="">
          <FormButton class="ml-2">Manage</FormButton>
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
