<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <!-- Static Spacer to allow for absolutely positioned HeaderNavBar  -->
      <div class="h-14 w-full shrink-0"></div>

      <!-- Sidebar -->
      <div class="relative flex h-[calc(100dvh-3.5rem)]">
        <div class="h-full w-64 shrink-0 border-r border-outline-3 px-2 py-3">
          <LayoutSidebar>
            <LayoutSidebarMenu>
              <LayoutSidebarMenuGroup>
                <LayoutSidebarMenuGroupItem label="Dashboard" :to="homeRoute" external>
                  <template #icon>
                    <Squares2X2Icon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>

                <LayoutSidebarMenuGroupItem
                  label="Projects"
                  :to="projectsRoute"
                  external
                >
                  <template #icon>
                    <Squares2X2Icon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup collapsible title="Workspaces">
                <template #title-icon>
                  <UserAvatar size="sm" :user="activeUser" hover-effect class="ml-1" />
                </template>
                <LayoutSidebarMenuGroupItem
                  v-for="(item, key) in workspacesItems"
                  :key="key"
                  :label="item.label"
                  :to="item.to"
                />
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup collapsible title="Resources">
                <LayoutSidebarMenuGroupItem
                  label="Connectors"
                  to="https://speckle.systems/features/connectors/"
                  external
                >
                  <template #icon>
                    <IconConnectors class="h-4 w-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
                <LayoutSidebarMenuGroupItem
                  label="Community forum"
                  to="https://speckle.community/"
                  external
                >
                  <template #icon>
                    <GlobeAltIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
                <LayoutSidebarMenuGroupItem label="Give us feedback" to="/" external>
                  <template #icon>
                    <ChatBubbleLeftIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
                <LayoutSidebarMenuGroupItem
                  label="Documentation"
                  to="https://speckle.guide/"
                  external
                >
                  <template #icon>
                    <BriefcaseIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
                <LayoutSidebarMenuGroupItem label="Changelog" to="/" external>
                  <template #icon>
                    <ClockIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </LayoutSidebarMenuGroup>
            </LayoutSidebarMenu>
          </LayoutSidebar>
        </div>

        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
          <div class="container mx-auto px-12">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
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
import { homeRoute, projectsRoute, workspaceRoute } from '~/lib/common/helpers/route'
import { settingsSidebarWorkspacesQuery } from '~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

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
