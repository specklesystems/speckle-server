<template>
  <div class="flex flex-col gap-4 sm:flex-row justify-between md:items-center">
    <div class="flex gap-2 md:mb-3 md:mt-2">
      <div class="flex items-center mr-2">
        <WorkspaceAvatar
          :logo="workspaceInfo.logo"
          :default-logo-index="workspaceInfo.defaultLogoIndex"
          size="lg"
        />
      </div>
      <div class="flex flex-col">
        <h1 class="text-heading">{{ workspaceInfo.name }}</h1>
        <div class="text-body-xs text-foreground-2">
          {{ workspaceInfo.description || 'No workspace description' }}
        </div>
      </div>
    </div>
    <div
      class="flex md:items-center gap-x-3 md:flex-row"
      :class="[isWorkspaceAdmin ? 'flex-col' : 'flex-row items-cenetr']"
    >
      <div
        class="flex items-center gap-x-3 md:mb-0"
        :class="[!isWorkspaceAdmin ? 'flex-1' : ' mb-3']"
      >
        <CommonBadge rounded :color-classes="'text-foreground-2 bg-primary-muted'">
          {{ workspaceInfo.totalProjects.totalCount || 0 }} Project{{
            workspaceInfo.totalProjects.totalCount === 1 ? '' : 's'
          }}
        </CommonBadge>
        <CommonBadge rounded :color-classes="'text-foreground-2 bg-primary-muted'">
          <span class="capitalize">
            {{ workspaceInfo.role?.split(':').reverse()[0] }}
          </span>
        </CommonBadge>
      </div>
      <div class="flex items-center gap-x-3">
        <div
          v-if="isWorkspaceAdmin && workspaceInfo.billing"
          class="flex-1 md:flex-auto"
        >
          <WorkspacePageVersionCount
            :versions-count="workspaceInfo.billing.versionsCount"
          />
        </div>
        <div class="flex items-center gap-x-3">
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
      </div>
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
    billing {
      versionsCount {
        ...WorkspacePageVersionCount_WorkspaceVersionsCount
      }
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
