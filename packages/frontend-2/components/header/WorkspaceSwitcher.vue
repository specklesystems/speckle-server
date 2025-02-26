<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: userOpen }">
        <span class="sr-only">Open workspace menu</span>
        <div class="flex items-center gap-2 p-0.5 hover:bg-highlight-2 rounded">
          <template v-if="hasWorkspaces">
            <WorkspaceAvatar
              :name="workspaces[0].name"
              :logo="workspaces[0].logo"
              size="sm"
            />
            <p class="text-body-xs text-foreground">
              {{ workspaces[0].name }}
            </p>
          </template>
          <ChevronDownIcon :class="userOpen ? 'rotate-180' : ''" class="h-3 w-3" />
        </div>
      </MenuButton>
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems
          class="absolute left-4 top-14 w-64 origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden divide-y divide-outline-2"
        >
          <div class="p-2 pb-4 flex flex-col gap-y-4">
            <div class="flex gap-x-2 items-center">
              <WorkspaceAvatar
                :name="workspaces[0].name"
                :logo="workspaces[0].logo"
                size="lg"
              />
              <div class="flex flex-col space-between">
                <p class="text-body-xs text-foreground">
                  {{ workspaces[0].name }}
                </p>
                <p class="text-body-2xs text-foreground-2 capitalize">
                  {{ workspaces[0].plan?.name }}
                </p>
              </div>
            </div>
            <div class="flex gap-x-2">
              <FormButton full-width color="outline" size="sm">Settings</FormButton>
              <FormButton full-width color="outline" size="sm">
                Invite members
              </FormButton>
            </div>
          </div>
          <div class="p-3 pt-1">
            <LayoutSidebarMenuGroup
              title="Workspaces"
              :icon-click="isGuest ? undefined : handlePlusClick"
              icon-text="Create workspace"
            >
              <div v-if="hasWorkspaces">
                <template v-for="(item, key) in workspaces" :key="key">
                  <NuxtLink
                    v-if="item.creationState?.completed !== false"
                    :to="workspaceRoute(item.slug)"
                  >
                    <LayoutSidebarMenuGroupItem :label="item.name">
                      <template #icon>
                        <WorkspaceAvatar
                          :name="item.name"
                          :logo="item.logo"
                          size="sm"
                        />
                      </template>
                    </LayoutSidebarMenuGroupItem>
                  </NuxtLink>
                </template>
              </div>
            </LayoutSidebarMenuGroup>
          </div>
          <div v-if="hasDiscoverableWorkspaces" class="p-3">
            <NuxtLink class="flex justify-between items-center">
              <p class="text-body-xs text-foreground">Join existing workspaces</p>
              <CommonBadge color-classes="bg-foundation-2 text-foreground-2" rounded>
                {{ discoverableWorkspacesCount }}
              </CommonBadge>
            </NuxtLink>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { workspaceCreateRoute, workspaceRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useUserWorkspaces,
  useUserDiscoverableWorkspaces
} from '~/lib/user/composables/workspaces'

const { isGuest } = useActiveUser()
const menuButtonId = useId()
const mixpanel = useMixpanel()
const { workspaces, hasWorkspaces } = useUserWorkspaces()
const { hasDiscoverableWorkspaces, discoverableWorkspacesCount } =
  useUserDiscoverableWorkspaces()

// const isWorkspacesEnabled = useIsWorkspacesEnabled()

const handlePlusClick = () => {
  navigateTo(workspaceCreateRoute())
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'sidebar'
  })
}

// const isCurrentWorkspace = (...routes: string[]): boolean => {
//   return routes.some((routeTo) => route.path === routeTo)
// }
</script>
