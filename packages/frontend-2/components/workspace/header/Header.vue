<template>
  <div class="flex flex-col sm:gap-4 sm:flex-row justify-between sm:items-center">
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
        class="text-body-3xs bg-foundation-2 text-foreground-2 rounded px-3 py-1 font-medium select-none whitespace-nowrap"
      >
        {{ workspaceInfo.totalProjects.totalCount || 0 }} Project{{
          workspaceInfo.totalProjects.totalCount === 1 ? '' : 's'
        }}
      </div>
      <UserAvatarGroup
        :users="team.map((teamMember) => teamMember.user)"
        class="max-w-[104px]"
      />
      <FormButton
        v-if="isWorkspaceAdmin"
        color="outline"
        @click="showInviteDialog = !showInviteDialog"
      >
        Invite
      </FormButton>
      <LayoutMenu
        v-model:open="showActionsMenu"
        :items="actionsItems"
        :menu-position="HorizontalDirection.Left"
        @click.stop.prevent
        @chosen="onActionChosen"
      >
        <FormButton
          color="subtle"
          hide-text
          :icon-right="EllipsisHorizontalIcon"
          @click="showActionsMenu = !showActionsMenu"
        />
      </LayoutMenu>
    </div>
    <WorkspaceInviteDialog
      v-model:open="showInviteDialog"
      :workspace-id="workspaceInfo.id"
      :workspace="workspaceInfo"
    />
    <SettingsDialog
      v-model:open="showSettingsDialog"
      target-menu-item="general"
      :target-workspace-id="workspaceInfo.id"
    />
  </div>
</template>

<script setup lang="ts">
import { Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceHeader_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { copyWorkspaceLink } from '~/lib/workspaces/composables/management'
import { HorizontalDirection } from '~~/lib/common/composables/window'

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

enum ActionTypes {
  Settings = 'settings',
  CopyLink = 'copy-link'
}

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const showInviteDialog = ref(false)
const showActionsMenu = ref(false)
const showSettingsDialog = ref(false)

const team = computed(() => props.workspaceInfo.team.items || [])
const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [{ title: 'Copy link', id: ActionTypes.CopyLink }],
  [{ title: 'Settings...', id: ActionTypes.Settings }]
])

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.CopyLink:
      copyWorkspaceLink(props.workspaceInfo.id)
      break
    case ActionTypes.Settings:
      showSettingsDialog.value = true
      break
  }
}
</script>
