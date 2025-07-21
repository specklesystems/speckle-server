<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="group h-full" data-no-external-confirm>
    <template v-if="showSidebar">
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
            <LayoutSidebarMenuGroup v-if="isWorkspacesEnabled" class="lg:hidden mb-4">
              <HeaderWorkspaceSwitcher />
            </LayoutSidebarMenuGroup>

            <div class="flex flex-col gap-y-2 lg:gap-y-4">
              <LayoutSidebarMenuGroup>
                <NuxtLink :to="projectsLink" @click="isOpenMobile = false">
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
                  <div @click="openExplainerVideoDialog">
                    <LayoutSidebarMenuGroupItem label="Getting started">
                      <template #icon>
                        <IconPlay class="size-4 text-foreground-2" />
                      </template>
                    </LayoutSidebarMenuGroupItem>
                  </div>
                  <WorkspaceExplainerVideoDialog
                    v-model:open="showExplainerVideoDialog"
                  />
                </div>
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup title="Resources" collapsible>
                <CalPopUp v-if="isWorkspacesEnabled">
                  <LayoutSidebarMenuGroupItem label="Book an intro call">
                    <template #icon>
                      <IconCalendar class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                </CalPopUp>

                <div v-if="isWorkspacesEnabled" @click="openChat">
                  <LayoutSidebarMenuGroupItem label="Give us feedback">
                    <template #icon>
                      <IconFeedback class="size-4 text-foreground-2" />
                    </template>
                  </LayoutSidebarMenuGroupItem>
                </div>

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
  docsPageUrl
} from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useNavigation } from '~~/lib/navigation/composables/navigation'
import { useMixpanel } from '~~/lib/core/composables/mp'

const { isLoggedIn } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const route = useRoute()
const { activeWorkspaceSlug, isProjectsActive } = useNavigation()
const { $intercom } = useNuxtApp()
const mixpanel = useMixpanel()

const isOpenMobile = ref(false)
const showExplainerVideoDialog = ref(false)

const projectsLink = computed(() => {
  return isWorkspacesEnabled.value
    ? activeWorkspaceSlug.value
      ? workspaceRoute(activeWorkspaceSlug.value)
      : projectsRoute
    : projectsRoute
})

const showSidebar = computed(() => {
  return isWorkspacesEnabled.value
    ? (!!activeWorkspaceSlug.value || isProjectsActive.value) && isLoggedIn.value
    : isLoggedIn.value
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
