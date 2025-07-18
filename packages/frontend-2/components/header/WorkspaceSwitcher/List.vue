<template>
  <div class="p-2 pt-1 max-h-[60vh] lg:max-h-96 overflow-y-auto simple-scrollbar">
    <LayoutSidebarMenuGroup
      title="Workspaces"
      :icon-click="isGuest ? undefined : handlePlusClick"
      icon-text="Create workspace"
      always-show-icon
    >
      <div v-if="isLoading" class="flex justify-center pt-2 pb-4">
        <CommonLoadingIcon />
      </div>
      <template v-else>
        <HeaderWorkspaceSwitcherListItem
          v-for="workspace in workspaces"
          :key="`menu-item-${workspace.id}`"
          :is-active="activeWorkspaceSlug === workspace.slug"
          :workspace="workspace"
        />
        <HeaderWorkspaceSwitcherListItem
          v-if="hasPersonalProjects"
          :is-active="route.path === projectsRoute"
          name="Personal projects"
          tag="LEGACY"
        />
      </template>
    </LayoutSidebarMenuGroup>
  </div>
</template>

<script setup lang="ts">
import { projectsRoute, workspaceCreateRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { navigationWorkspaceListQuery } from '~/lib/navigation/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'

const route = useRoute()
const mixpanel = useMixpanel()
const { isGuest } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const activeWorkspaceSlug = useActiveWorkspaceSlug()

const { result, loading: isLoading } = useQuery(
  navigationWorkspaceListQuery,
  () => ({
    projectFilter: {
      personalOnly: true
    },
    workspaceFilter: {
      completed: true
    }
  }),
  {
    enabled: isWorkspacesEnabled.value
  }
)

const workspaces = computed(() => result.value?.activeUser?.workspaces.items || [])

const hasPersonalProjects = computed(
  () => !!result.value?.activeUser?.projects?.totalCount
)

const handlePlusClick = () => {
  navigateTo(workspaceCreateRoute)
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'navigation'
  })
}
</script>
