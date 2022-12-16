<template>
  <ProjectPageStatsBlock>
    <template #top>
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-1.5">
          <UsersIcon class="h-5 w-5" />
          <span class="label font-bold">Team</span>
          <CommonBadge color-classes="text-foreground-on-primary bg-info-darker">
            {{ project.team.length }}
          </CommonBadge>
        </div>
        <div class="caption">
          <NuxtLink to="javascript:void(0);">View all</NuxtLink>
        </div>
      </div>
    </template>
    <template #bottom>
      <div class="flex space-x-[1px]">
        <div
          v-if="project.team.length"
          class="flex space-x-[1px] flex-wrap overflow-hidden h-8"
        >
          <UserAvatar
            v-for="user in project.team"
            :key="user.id"
            :avatar-url="user.avatar"
          />
        </div>
        <UserAvatarPlus />
      </div>
    </template>
  </ProjectPageStatsBlock>
</template>
<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/20/solid'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockTeam on Project {
    team {
      id
      name
      avatar
    }
  }
`)

defineProps<{
  project: ProjectPageStatsBlockTeamFragment
}>()
</script>
