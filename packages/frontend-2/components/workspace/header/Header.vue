<template>
  <div
    class="flex flex-col gap-6 justify-between"
    :class="[
      isWorkspaceAdmin ? 'xl:flex-row xl:items-center' : 'lg:flex-row lg:items-center'
    ]"
  >
    <div class="flex gap-2 md:mb-3 md:mt-2">
      <div class="flex items-center mr-2">
        <WorkspaceAvatar
          :logo="workspaceInfo.logo"
          :default-logo-index="workspaceInfo.defaultLogoIndex"
          size="lg"
        />
      </div>
      <div class="group flex flex-col">
        <h1 class="text-heading line-clamp-2">{{ workspaceInfo.name }}</h1>
        <div class="flex">
          <div
            ref="descriptionRef"
            class="text-body-xs text-foreground-2 line-clamp-1 max-w-xs"
          >
            {{ workspaceInfo.description || 'No workspace description' }}
          </div>
          <FormButton
            v-if="hasOverflow"
            color="subtle"
            size="sm"
            class="md:hidden group-hover:flex items-center text-foreground text-body-2xs"
            @click="showDescriptionDialog"
          >
            Read more
            <IconTriangle class="text-foreground" />
          </FormButton>
        </div>
      </div>
    </div>
    <div
      class="flex justify-between md:items-center gap-x-3 md:flex-row"
      :class="[isWorkspaceAdmin ? 'flex-col' : 'flex-row items-center']"
    >
      <div
        class="flex items-center gap-x-3 md:mb-0"
        :class="[isWorkspaceAdmin ? 'mb-3' : ' flex-1']"
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
        <div v-if="workspaceInfo.billing" class="flex-1 md:flex-auto">
          <button
            class="block"
            @click="openSettingsDialog(SettingMenuKeys.Workspace.Billing)"
          >
            <WorkspacePageVersionCount
              :versions-count="workspaceInfo.billing.versionsCount"
            />
          </button>
        </div>
        <div class="flex items-center gap-x-3">
          <button
            class="block"
            @click="openSettingsDialog(SettingMenuKeys.Workspace.Members)"
          >
            <UserAvatarGroup
              :users="team.map((teamMember) => teamMember.user)"
              class="max-w-[104px]"
            />
          </button>
          <FormButton
            v-if="isWorkspaceAdmin"
            class="hidden md:block"
            color="outline"
            @click="$emit('show-invite-dialog')"
          >
            Invite
          </FormButton>
          <FormButton
            v-if="isWorkspaceAdmin"
            class="hidden md:block"
            color="subtle"
            @click="$emit('show-move-projects-dialog')"
          >
            Move projects
          </FormButton>
          <LayoutMenu
            v-model:open="showActionsMenu"
            :items="actionsItems"
            :menu-position="HorizontalDirection.Left"
            :menu-id="menuId"
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
    <DescriptionDialog
      v-model:open="isDescriptionDialogOpen"
      :description="workspaceInfo.description || 'No workspace description'"
    />
  </div>
</template>

<script setup lang="ts">
import { useElementSize, useBreakpoints } from '@vueuse/core'
import { Roles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceHeader_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { EllipsisHorizontalIcon } from '@heroicons/vue/24/solid'
import { copyWorkspaceLink } from '~/lib/workspaces/composables/management'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import {
  SettingMenuKeys,
  type AvailableSettingsMenuKeys
} from '~/lib/settings/helpers/types'
import DescriptionDialog from './DescriptionDialog.vue'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'

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
  CopyLink = 'copy-link',
  MoveProjects = 'move-projects',
  Invite = 'invite'
}

const emit = defineEmits<{
  (e: 'show-invite-dialog'): void
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
  (e: 'show-move-projects-dialog'): void
}>()

const props = defineProps<{
  workspaceInfo: WorkspaceHeader_WorkspaceFragment
}>()

const menuId = useId()
const breakpoints = useBreakpoints(TailwindBreakpoints)

const isMobile = breakpoints.smaller('md')
const showActionsMenu = ref(false)

const team = computed(() => props.workspaceInfo.team.items || [])
const isWorkspaceAdmin = computed(
  () => props.workspaceInfo.role === Roles.Workspace.Admin
)
const actionsItems = computed<LayoutMenuItem[][]>(() => [
  [
    ...(isMobile.value
      ? [
          { title: 'Move projects', id: ActionTypes.MoveProjects },
          { title: 'Invite', id: ActionTypes.Invite }
        ]
      : []),
    { title: 'Copy link', id: ActionTypes.CopyLink }
  ],
  [{ title: 'Settings...', id: ActionTypes.Settings }]
])

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}

const onActionChosen = (params: { item: LayoutMenuItem; event: MouseEvent }) => {
  const { item } = params

  switch (item.id) {
    case ActionTypes.CopyLink:
      copyWorkspaceLink(props.workspaceInfo.id)
      break
    case ActionTypes.Settings:
      openSettingsDialog(SettingMenuKeys.Workspace.General)
      break
    case ActionTypes.MoveProjects:
      emit('show-move-projects-dialog')
      break
    case ActionTypes.Invite:
      emit('show-invite-dialog')
      break
  }
}

const descriptionRef = ref<HTMLElement | null>(null)
const { height } = useElementSize(descriptionRef)

const hasOverflow = computed(() => {
  if (descriptionRef.value) {
    return descriptionRef.value.scrollHeight > height.value
  }
  return false
})

const isDescriptionDialogOpen = ref(false)

const showDescriptionDialog = () => {
  isDescriptionDialogOpen.value = true
}
</script>
