<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
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
        class="absolute z-40 lg:static h-full flex w-[17rem] shrink-0 transition-all"
        :class="isOpenMobile ? '' : '-translate-x-[17rem] lg:translate-x-0'"
      >
        <LayoutSidebar
          class="border-r border-outline-3 px-2 pt-3 pb-2 bg-foundation-page"
        >
          <LayoutSidebarMenu>
            <LayoutSidebarMenuGroup>
              <template v-if="!isWorkspacesEnabled">
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
              </template>

              <NuxtLink
                v-if="activeWorkspaceSlug"
                :to="workspaceRoute(activeWorkspaceSlug)"
                @click="isOpenMobile = false"
              >
                <LayoutSidebarMenuGroupItem
                  label="Home"
                  :active="route.name === 'workspaces-slug'"
                >
                  <template #icon>
                    <HomeIcon class="size-4 stroke-[1.5px]" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>

              <NuxtLink v-else :to="projectsRoute" @click="isOpenMobile = false">
                <LayoutSidebarMenuGroupItem
                  label="Projects"
                  :active="isActive(projectsRoute)"
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
                    <IconConnectors class="size-4 ml-px text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </NuxtLink>
            </LayoutSidebarMenuGroup>

            <LayoutSidebarMenuGroup title="Resources" collapsible>
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

              <div @click="openFeedbackDialog">
                <LayoutSidebarMenuGroupItem label="Give us feedback">
                  <template #icon>
                    <IconFeedback class="size-4 text-foreground-2" />
                  </template>
                </LayoutSidebarMenuGroupItem>
              </div>

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
        </LayoutSidebar>
      </div>
    </template>

    <FeedbackDialog v-model:open="showFeedbackDialog" />
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
  homeRoute,
  projectsRoute,
  connectorsRoute,
  workspaceRoute
} from '~/lib/common/helpers/route'
import { useRoute } from 'vue-router'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { HomeIcon } from '@heroicons/vue/24/outline'
import { useNavigation } from '~~/lib/navigation/composables/navigation'

const { isLoggedIn } = useActiveUser()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const route = useRoute()
const { activeWorkspaceSlug } = useNavigation()

const isOpenMobile = ref(false)
const showFeedbackDialog = ref(false)

const isActive = (...routes: string[]): boolean => {
  return routes.some((routeTo) => route.path === routeTo)
}

const openFeedbackDialog = () => {
  showFeedbackDialog.value = true
  isOpenMobile.value = false
}
</script>
