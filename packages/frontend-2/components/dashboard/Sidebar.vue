<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <template v-if="isLoggedIn">
      <Portal to="mobile-navigation">
        <div class="lg:hidden">
          <FormButton
            :color="isOpenMobile ? 'outline' : 'subtle'"
            size="sm"
            class="mt-px"
            @click="isOpenMobile = !isOpenMobile"
          >
            <IconSidebar v-if="!isOpenMobile" class="h-4 w-4 -ml-1 -mr-1" />
            <XMarkIcon v-else class="h-4 w-4 -ml-1 -mr-1" />
          </FormButton>
        </div>
      </Portal>
      <div
        v-keyboard-clickable
        class="lg:hidden absolute inset-0 backdrop-blur-sm z-40 transition-all"
        :class="isOpenMobile ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        @click="isOpenMobile = false"
      />
      <div
        class="absolute z-40 lg:static h-full flex w-60 lg:w-64 shrink-0 transition-all"
        :class="isOpenMobile ? '' : '-translate-x-60 lg:translate-x-0'"
      >
        <LayoutSidebar class="border-r border-outline-3 px-2 py-3 bg-foundation-page">
          <LayoutSidebarMenu>
            <LayoutSidebarMenuGroup>
              <NuxtLink :to="homeRoute" @click="isOpenMobile = false">
                <LayoutSidebarMenuGroupItem
                  label="Dashboard"
                  :active="isActive(homeRoute)"
                >
                  <template #icon>
                    <HomeIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink :to="projectsRoute" @click="isOpenMobile = false">
                <LayoutSidebarMenuGroupItem
                  label="Projects"
                  :active="isActive(projectsRoute)"
                >
                  <template #icon>
                    <Squares2X2Icon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
            </LayoutSidebarMenuGroup>

            <!-- Remove workspacesItems.length conditional at launch of Workspaces  -->
            <LayoutSidebarMenuGroup
              v-if="isWorkspacesEnabled && workspacesItems.length"
              collapsible
              title="Workspaces"
            >
              <NuxtLink
                v-for="(item, key) in workspacesItems"
                :key="key"
                :to="item.to"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem
                  :label="item.label"
                  :active="isActive(item.to)"
                >
                  <template #icon>
                    <WorkspaceAvatar
                      :logo="item.logo"
                      :default-logo-index="item.defaultLogoIndex"
                      size="sm"
                    />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
              <LayoutSidebarMenuGroupItem
                v-if="isUserAdmin"
                label="Add workspace"
                @click="showWorkspaceCreateDialog = true"
              >
                <template #icon>
                  <PlusIcon class="h-4 w-4 text-foreground-2" />
                </template>
              </LayoutSidebarMenuGroupItem>
            </LayoutSidebarMenuGroup>

            <LayoutSidebarMenuGroup title="Resources">
              <NuxtLink :to="connectorsPageUrl" target="_blank">
                <LayoutSidebarMenuGroupItem label="Connectors" external>
                  <template #icon>
                    <IconConnectors class="h-4 w-4 ml-px text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink to="https://speckle.community/" target="_blank">
                <LayoutSidebarMenuGroupItem label="Community forum" external>
                  <template #icon>
                    <GlobeAltIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://docs.google.com/forms/d/e/1FAIpQLSeTOU8i0KwpgBG7ONimsh4YMqvLKZfSRhWEOz4W0MyjQ1lfAQ/viewform"
                target="_blank"
              >
                <LayoutSidebarMenuGroupItem label="Give us feedback" external>
                  <template #icon>
                    <ChatBubbleLeftIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink to="https://speckle.guide/" target="_blank">
                <LayoutSidebarMenuGroupItem label="Documentation" external>
                  <template #icon>
                    <BriefcaseIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://speckle.community/c/making-speckle/changelog"
                target="_blank"
              >
                <LayoutSidebarMenuGroupItem label="Changelog" external>
                  <template #icon>
                    <ClockIcon class="h-5 w-5 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
            </LayoutSidebarMenuGroup>
          </LayoutSidebarMenu>
        </LayoutSidebar>
      </div>
    </template>

    <WorkspaceCreateDialog v-model:open="showWorkspaceCreateDialog" />
  </div>
</template>
<script setup lang="ts">
import {
  BriefcaseIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  GlobeAltIcon,
  ClockIcon,
  Squares2X2Icon,
  HomeIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
import {
  FormButton,
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  LayoutSidebarMenuGroupItem
} from '@speckle/ui-components'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  homeRoute,
  projectsRoute,
  workspaceRoute,
  connectorsPageUrl
} from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const { isLoggedIn } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const route = useRoute()
const { activeUser: user } = useActiveUser()

const isOpenMobile = ref(false)
const showWorkspaceCreateDialog = ref(false)

const { result: workspaceResult } = useQuery(settingsSidebarQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const isActive = (...routes: string[]): boolean => {
  return routes.some((routeTo) => route.path === routeTo)
}

const isUserAdmin = computed(() => user.value?.role === 'server:admin')
const workspacesItems = computed(() =>
  workspaceResult.value?.activeUser
    ? workspaceResult.value.activeUser.workspaces.items.map((workspace) => ({
        label: workspace.name,
        id: workspace.id,
        to: workspaceRoute(workspace.id),
        logo: workspace.logo,
        defaultLogoIndex: workspace.defaultLogoIndex
      }))
    : []
)
</script>
