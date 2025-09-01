<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div class="group h-full">
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
        class="absolute z-40 lg:static h-full flex w-[13rem] shrink-0 transition-all"
        :class="isOpenMobile ? '' : '-translate-x-[13rem] lg:translate-x-0'"
      >
        <LayoutSidebar
          class="border-r border-outline-3 px-2 pt-3 pb-2 bg-foundation-page"
        >
          <LayoutSidebarMenu>
            <LayoutSidebarMenuGroup
              v-if="isWorkspacesEnabled && isLoggedIn"
              class="lg:hidden mb-4"
            >
              <HeaderWorkspaceSwitcher />
            </LayoutSidebarMenuGroup>

            <div class="flex flex-col gap-y-2 lg:gap-y-4">
              <LayoutSidebarMenuGroup>
                <NuxtLink
                  v-if="showWorkspaceLinks"
                  :to="projectsLink"
                  @click="isOpenMobile = false"
                >
                  <LayoutSidebarMenuGroupItem
                    label="Projects"
                    :active="
                      route.name === 'workspaces-slug' || isActive(projectsRoute)
                    "
                  >
                    <template #icon>
                      <IconProjects class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                </NuxtLink>

                <NuxtLink
                  v-if="showWorkspaceLinks && canListDashboards"
                  :to="dashboardsRoute(activeWorkspaceSlug)"
                  @click="isOpenMobile = false"
                >
                  <LayoutSidebarMenuGroupItem
                    label="Intelligence"
                    :active="isActive(dashboardsRoute(activeWorkspaceSlug))"
                  >
                    <template #icon>
                      <IconProjects class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                </NuxtLink>

                <NuxtLink :to="connectorsRoute" @click="isOpenMobile = false">
                  <LayoutSidebarMenuGroupItem
                    label="Connectors"
                    :active="isActive(connectorsRoute)"
                  >
                    <template #icon>
                      <IconConnectors class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                </NuxtLink>

                <div v-if="isWorkspacesEnabled">
                  <LayoutSidebarMenuGroupItem
                    label="Getting started"
                    @click="openExplainerVideoDialog"
                  >
                    <template #icon>
                      <IconPlay class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                  <WorkspaceExplainerVideoDialog
                    v-model:open="showExplainerVideoDialog"
                  />
                </div>
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup title="Resources" collapsible>
                <LayoutSidebarMenuGroupItem
                  v-if="isWorkspacesEnabled"
                  label="Give us feedback"
                  @click="openChat"
                >
                  <template #icon>
                    <IconFeedback class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>

                <NuxtLink :to="tutorialsRoute" @click="isOpenMobile = false">
                  <LayoutSidebarMenuGroupItem
                    label="Tutorials"
                    :active="isActive(tutorialsRoute)"
                  >
                    <template #icon>
                      <IconTutorials class="size-4 text-foreground-2" />
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
                  :to="docsPageUrl"
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
            </div>
          </LayoutSidebarMenu>
          <template v-if="showIntelligenceCommunityStandUpPromo" #promo>
            <DashboardIntelligencePromo />
          </template>
        </LayoutSidebar>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import {
  FormButton,
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  LayoutSidebarMenuGroupItem
} from '@speckle/ui-components'
import {
  projectsRoute,
  connectorsRoute,
  workspaceRoute,
  tutorialsRoute,
  docsPageUrl,
  dashboardsRoute
} from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useActiveWorkspaceSlug } from '~/lib/user/composables/activeWorkspace'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import dayjs from 'dayjs'
import { useActiveUserMeta } from '~/lib/user/composables/meta'

const dashboardSidebarQuery = graphql(`
  query DashboardSidebar {
    activeUser {
      id
      activeWorkspace {
        id
        role
      }
    }
  }
`)

const sidebarPermissionsQuery = graphql(`
  query SidebarPermissions($slug: String!) {
    workspaceBySlug(slug: $slug) {
      permissions {
        canListDashboards {
          ...FullPermissionCheckResult
        }
      }
    }
  }
`)

const { isLoggedIn } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const isDashboardsEnabled = useIsDashboardsModuleEnabled()
const route = useRoute()
const activeWorkspaceSlug = useActiveWorkspaceSlug()
const { $intercom } = useNuxtApp()
const mixpanel = useMixpanel()
const { result: permissionsResult } = useQuery(
  sidebarPermissionsQuery,
  () => ({
    slug: activeWorkspaceSlug.value || ''
  }),
  () => ({
    enabled: isDashboardsEnabled.value && !!activeWorkspaceSlug.value
  })
)
const { result } = useQuery(dashboardSidebarQuery, () => ({}), {
  enabled: isWorkspacesEnabled.value
})
const { hasDismissedIntelligenceCommunityStandUpBanner } = useActiveUserMeta()

const isOpenMobile = ref(false)
const showExplainerVideoDialog = ref(false)

const showIntelligenceCommunityStandUpPromo = computed(() => {
  if (hasDismissedIntelligenceCommunityStandUpBanner.value) return false
  return dayjs().isBefore('2025-09-10', 'day')
})
const activeWorkspace = computed(() => result.value?.activeUser?.activeWorkspace)
const canListDashboards = computed(() => {
  return permissionsResult.value?.workspaceBySlug?.permissions?.canListDashboards
    ?.authorized
})

const showWorkspaceLinks = computed(() => {
  return isWorkspacesEnabled.value
    ? activeWorkspace.value
      ? !!activeWorkspace.value?.role
      : true
    : isLoggedIn.value
})

const projectsLink = computed(() => {
  return isWorkspacesEnabled.value
    ? activeWorkspaceSlug.value
      ? workspaceRoute(activeWorkspaceSlug.value)
      : projectsRoute
    : projectsRoute
})

const openChat = () => {
  $intercom.show()
  isOpenMobile.value = false
}

const openExplainerVideoDialog = () => {
  showExplainerVideoDialog.value = true
  isOpenMobile.value = false
  mixpanel.track('Getting Started Video Opened', {
    location: 'sidebar'
  })
}

const isActive = (...routes: string[]): boolean => {
  return routes.some((routeTo) => route.path === routeTo)
}
</script>
