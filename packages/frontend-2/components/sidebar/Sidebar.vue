<template>
  <LayoutSidebar>
    <LayoutSidebarMenu>
      <LayoutSidebarMenuGroup>
        <NuxtLink :to="homeRoute">
          <LayoutSidebarMenuGroupItem label="Dashboard">
            <template #icon>
              <Squares2X2Icon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>

        <NuxtLink :to="projectsRoute">
          <LayoutSidebarMenuGroupItem label="Projects">
            <template #icon>
              <Squares2X2Icon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>
      </LayoutSidebarMenuGroup>

      <LayoutSidebarMenuGroup collapsible title="Workspaces">
        <template #title-icon>
          <UserAvatar size="sm" :user="activeUser" hover-effect class="ml-1" />
        </template>
        <NuxtLink v-for="(item, key) in workspacesItems" :key="key" :to="item.to">
          <LayoutSidebarMenuGroupItem :label="item.label" />
        </NuxtLink>
      </LayoutSidebarMenuGroup>

      <LayoutSidebarMenuGroup collapsible title="Resources">
        <NuxtLink to="https://speckle.systems/features/connectors/" target="_blank">
          <LayoutSidebarMenuGroupItem label="Connectors">
            <template #icon>
              <IconConnectors class="h-4 w-4 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>

        <NuxtLink to="https://speckle.community/" target="_blank">
          <LayoutSidebarMenuGroupItem label="Community forum">
            <template #icon>
              <GlobeAltIcon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>

        <NuxtLink to="#0" target="_blank">
          <LayoutSidebarMenuGroupItem label="Give us feedback" to="/" external>
            <template #icon>
              <ChatBubbleLeftIcon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>

        <NuxtLink to="https://speckle.guide/" target="_blank">
          <LayoutSidebarMenuGroupItem label="Documentation">
            <template #icon>
              <BriefcaseIcon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>

        <NuxtLink to="#0" target="_blank">
          <LayoutSidebarMenuGroupItem label="Changelog" to="/" external>
            <template #icon>
              <ClockIcon class="h-5 w-5 text-foreground-2" />
            </template>
          </LayoutSidebarMenuGroupItem>
        </NuxtLink>
      </LayoutSidebarMenuGroup>
    </LayoutSidebarMenu>
  </LayoutSidebar>
</template>
<script setup lang="ts">
import {
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  GlobeAltIcon,
  ClockIcon,
  Squares2X2Icon
} from '@heroicons/vue/24/outline'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  LayoutSidebarMenuGroupItem
} from '@speckle/ui-components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { settingsSidebarWorkspacesQuery } from '~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { homeRoute, projectsRoute, workspaceRoute } from '~/lib/common/helpers/route'

const { activeUser } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { result: workspaceResult } = useQuery(settingsSidebarWorkspacesQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const workspacesItems = computed(() =>
  workspaceResult.value?.activeUser
    ? workspaceResult.value.activeUser.workspaces.items.map((workspace) => ({
        label: workspace.name,
        id: workspace.id,
        to: workspaceRoute(workspace.id)
      }))
    : []
)
</script>
