<template>
  <div class="flex items-center">
    <MenuItem class="min-w-0 w-full">
      <NuxtLink class="flex-1 min-w-0" @click="onClick">
        <LayoutSidebarMenuGroupItem
          :label="formattedName"
          :tag="tag"
          :active="itemIsActive"
          color-classes="bg-foundation-2 text-foreground-2"
        >
          <template #icon>
            <WorkspaceAvatar
              :name="formattedName"
              :logo="workspace ? workspace.logo : undefined"
              size="sm"
              class="flex-shrink-0"
            />
          </template>
        </LayoutSidebarMenuGroupItem>
      </NuxtLink>
    </MenuItem>
  </div>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import { workspaceRoute, projectsRoute } from '~/lib/common/helpers/route'
import type { HeaderWorkspaceSwitcherWorkspaceListItem_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { Roles, WorkspacePlans } from '@speckle/shared'

graphql(`
  fragment HeaderWorkspaceSwitcherWorkspaceListItem_Workspace on Workspace {
    id
    name
    logo
    role
    slug
    creationState {
      completed
    }
    plan {
      name
    }
  }
`)

const props = defineProps<{
  workspace?: MaybeNullOrUndefined<HeaderWorkspaceSwitcherWorkspaceListItem_WorkspaceFragment>
  name?: string
  tag?: string
  isActive?: boolean
}>()

const formattedName = computed(() => props.name || props.workspace?.name || '')
const tag = computed(() => {
  if (props.tag) return props.tag
  if (props.workspace?.plan?.name === WorkspacePlans.Free) return 'FREE'
  if (props.workspace?.role === Roles.Workspace.Guest) return 'GUEST'
  return undefined
})
const itemIsActive = computed(() => props.isActive)

const onClick = () => {
  if (props.workspace) {
    navigateTo(workspaceRoute(props.workspace.slug))
  } else {
    navigateTo(projectsRoute)
  }
}
</script>
