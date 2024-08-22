<template>
  <div class="flex flex-col sm:flex-row justify-between sm:items-center">
    <div class="flex gap-2 mb-3 mt-2">
      <div class="flex items-center">
        <WorkspaceAvatar
          :logo="workspaceInfo.logo"
          :default-logo-index="workspaceInfo.defaultLogoIndex"
          size="lg"
        />
      </div>
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
        :users="team.items.map((teamMember) => teamMember.user)"
        class="max-w-[104px]"
      />
      <FormButton
        color="outline"
        :disabled="!isWorkspaceAdmin"
        @click="showInviteDialog = !showInviteDialog"
      >
        Invite
      </FormButton>
    </div>
    <WorkspaceInviteDialog
      v-model:open="showInviteDialog"
      :workspace-id="workspaceInfo.id"
      :workspace="workspaceInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceHeader_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspaceHeader_Workspace on Workspace {
    ...WorkspaceAvatar_Workspace
    id
    role
    name
    logo
    description
    totalProjects: projects {
      totalCount
    }
    team {
      items {
        id
        user {
          id
          name
          ...LimitedUserAvatar
        }
      }
    }
    ...WorkspaceInviteDialog_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const showInviteDialog = ref(false)

const team = computed(() => props.workspaceInfo.team || [])
const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
</script>
