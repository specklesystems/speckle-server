<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="group">
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
            <IconSidebarClose v-else class="h-4 w-4 -ml-1 -mr-1" />
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
        class="absolute z-40 lg:static h-full flex w-[17rem] shrink-0 transition-all"
        :class="isOpenMobile ? '' : '-translate-x-[17rem] lg:translate-x-0'"
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
                    <HomeIcon class="size-4 stroke-[1.5px]" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink :to="projectsRoute" @click="isOpenMobile = false">
                <LayoutSidebarMenuGroupItem
                  label="Projects"
                  :active="isActive(projectsRoute)"
                >
                  <template #icon>
                    <IconProjects class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
            </LayoutSidebarMenuGroup>

            <LayoutSidebarMenuGroup
              v-if="isWorkspacesEnabled"
              collapsible
              title="Workspaces"
              :plus-click="
                isNotGuest
                  ? () => {
                      openWorkspaceCreateDialog()
                    }
                  : undefined
              "
              plus-text="Create workspace"
            >
              <NuxtLink :to="workspacesRoute" @click="isOpenMobile = false">
                <LayoutSidebarMenuGroupItem
                  label="Introducing workspaces"
                  :active="isActive(workspacesRoute)"
                  tag="BETA"
                >
                  <template #icon>
                    <IconWorkspaces class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
              <NuxtLink
                v-for="(item, key) in workspacesItems"
                :key="key"
                :to="item.to"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem
                  :label="item.label"
                  :active="isActive(item.to)"
                  class="!pl-1"
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
            </LayoutSidebarMenuGroup>

            <LayoutSidebarMenuGroup title="Resources" collapsible>
              <NuxtLink
                :to="connectorsPageUrl"
                target="_blank"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem label="Connectors" external>
                  <template #icon>
                    <IconConnectors class="size-4 ml-px text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://speckle.community/"
                target="_blank"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem label="Community forum" external>
                  <template #icon>
                    <IconCommunity class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://docs.google.com/forms/d/e/1FAIpQLSeTOU8i0KwpgBG7ONimsh4YMqvLKZfSRhWEOz4W0MyjQ1lfAQ/viewform"
                target="_blank"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem label="Give us feedback" external>
                  <template #icon>
                    <IconFeedback class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://speckle.guide/"
                target="_blank"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem label="Documentation" external>
                  <template #icon>
                    <IconDocumentation class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink
                to="https://speckle.community/c/making-speckle/changelog"
                target="_blank"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem label="Changelog" external>
                  <template #icon>
                    <IconChangelog class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
            </LayoutSidebarMenuGroup>
          </LayoutSidebarMenu>
          <template #promo>
            <LayoutSidebarPromo
              title="Specklecon 2024"
              text="Join us in London on 13-14 November for the ultimate Speckle community event."
              button-text="Get tickets"
              to="https://conf.speckle.systems/"
            />
          </template>
        </LayoutSidebar>
      </div>
    </template>

    <WorkspaceCreateDialog
      v-model:open="showWorkspaceCreateDialog"
      navigate-on-success
      event-source="sidebar"
    />
  </div>
</template>
<script setup lang="ts">
import {
  FormButton,
  LayoutSidebar,
  LayoutSidebarPromo,
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
  workspacesRoute,
  connectorsPageUrl
} from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { HomeIcon } from '@heroicons/vue/24/outline'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { Roles } from '@speckle/shared'

const { isLoggedIn } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const route = useRoute()
const { activeUser: user } = useActiveUser()
const mixpanel = useMixpanel()

const isOpenMobile = ref(false)
const showWorkspaceCreateDialog = ref(false)

const { result: workspaceResult, onResult: onWorkspaceResult } = useQuery(
  settingsSidebarQuery,
  null,
  {
    enabled: isWorkspacesEnabled.value
  }
)

const isActive = (...routes: string[]): boolean => {
  return routes.some((routeTo) => route.path === routeTo)
}

const isNotGuest = computed(
  () => Roles.Server.Admin || user.value?.role === Roles.Server.User
)

const workspacesItems = computed(() =>
  workspaceResult.value?.activeUser
    ? workspaceResult.value.activeUser.workspaces.items.map((workspace) => ({
        label: workspace.name,
        id: workspace.id,
        to: workspaceRoute(workspace.slug),
        logo: workspace.logo,
        defaultLogoIndex: workspace.defaultLogoIndex
      }))
    : []
)

const openWorkspaceCreateDialog = () => {
  showWorkspaceCreateDialog.value = true
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'sidebar'
  })
}

onWorkspaceResult((result) => {
  if (result.data?.activeUser) {
    const workspaceIds = result.data.activeUser.workspaces.items.map(
      (workspace) => workspace.id
    )

    if (workspaceIds.length > 0) {
      mixpanel.people.set('workspace_id', workspaceIds)
    }
  }
})
</script>
