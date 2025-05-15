<template>
  <div class="p-2 pt-1 max-h-[60vh] lg:max-h-96 overflow-y-auto simple-scrollbar">
    <LayoutSidebarMenuGroup
      title="Workspaces"
      :icon-click="isGuest ? undefined : handlePlusClick"
      icon-text="Create workspace"
      always-show-icon
    >
      <HeaderWorkspaceSwitcherListItem
        v-for="item in workspaces"
        :key="`menu-item-${item.id}`"
        :workspace="item"
      />
      <HeaderWorkspaceSwitcherListItem
        v-if="hasPersonalProjects"
        :is-active="route.path === projectsRoute"
        name="Personal projects"
        tag="LEGACY"
      />
    </LayoutSidebarMenuGroup>
  </div>
</template>

<script setup lang="ts">
import type { HeaderWorkspaceSwitcherWorkspaceListItem_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { projectsRoute, workspaceCreateRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'

defineProps<{
  workspaces: HeaderWorkspaceSwitcherWorkspaceListItem_WorkspaceFragment[]
  hasPersonalProjects: boolean
}>()

const route = useRoute()
const mixpanel = useMixpanel()
const { isGuest } = useActiveUser()

const handlePlusClick = () => {
  navigateTo(workspaceCreateRoute)
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'navigation'
  })
}
</script>
