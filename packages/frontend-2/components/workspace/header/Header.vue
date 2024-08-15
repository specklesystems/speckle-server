<template>
  <div class="flex flex-col sm:flex-row justify-between sm:items-center">
    <div class="flex gap-2 mb-3 mt-2">
      <img
        v-if="workspaceInfo.logo"
        :src="workspaceInfo.logo || ''"
        alt="Workspace logo"
        class="w-5 h-5 mt-0.5"
      />
      <div class="flex flex-col">
        <h1 class="text-heading-lg">{{ workspaceInfo.name }}</h1>
        <div class="text-body-xs text-foreground-2">
          {{ workspaceInfo.description || 'No workspace description' }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="text-body-3xs bg-foundation-2 text-foreground-2 rounded px-3 py-1 font-medium select-none"
      >
        {{ workspaceInfo.totalProjects.totalCount || 0 }} Project{{
          workspaceInfo.totalProjects.totalCount === 1 ? '' : 's'
        }}
      </div>
      <UserAvatarGroup
        :users="team.map((teamMember) => teamMember.user)"
        class="max-w-[104px]"
      />
      <FormButton color="outline" disabled>Invite</FormButton>
      <!-- <WorkspaceHeaderActions /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceHeader_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceHeader_Workspace on Workspace {
    id
    name
    logo
    description
    totalProjects: projects {
      totalCount
    }
    team {
      id
      user {
        id
        name
        ...LimitedUserAvatar
      }
    }
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const team = computed(() => props.workspaceInfo.team || [])
</script>
