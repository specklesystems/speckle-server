<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: menuOpen }" as="div">
        <div
          class="relative cursor-pointer p-1 w-8 h-8 flex items-center justify-center rounded-md"
          :class="menuOpen ? 'border border-outline-2' : ''"
        >
          <span class="sr-only">Open notifications menu</span>
          <div class="relative">
            <div
              v-if="!menuOpen && hasNotifications"
              class="absolute -top-[4px] -right-[4px] size-2 bg-danger rounded-full"
            />

            <Bell
              v-if="!menuOpen"
              :size="LucideSize.lg"
              :stroke-width="1.5"
              :absolute-stroke-width="true"
            />
            <X
              v-else
              :size="LucideSize.lg"
              :stroke-width="1.5"
              :absolute-stroke-width="true"
            />
          </div>
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
          class="absolute z-50 right-0 md:right-20 top-10 mt-1.5 w-full sm:w-72 origin-top-right bg-foundation outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-hidden pb-1"
        >
          <div class="px-3.5 pt-2 text-body-xs font-medium">Notifications</div>
          <p
            v-if="!hasNotifications"
            class="px-3.5 pt-2 pb-2.5 text-body-xs text-foreground-2 text-center"
          >
            No notifications
          </p>
          <MenuItem v-for="projectInvite in projectsInvites" :key="projectInvite?.id">
            <HeaderNavNotificationsProjectInvite :invite="projectInvite" />
          </MenuItem>
          <MenuItem
            v-for="workspacesInvite in workspacesInvites"
            :key="workspacesInvite?.id"
          >
            <HeaderNavNotificationsWorkspaceInvite :invite="workspacesInvite" />
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { X, Bell } from 'lucide-vue-next'
import { useQuery } from '@vue/apollo-composable'
import {
  navigationProjectInvitesQuery,
  navigationWorkspaceInvitesQuery
} from '~~/lib/navigation/graphql/queries'

const menuButtonId = useId()
const isWorkspacesEnabled = useIsWorkspacesEnabled()

const { result: projectInviteResult } = useQuery(navigationProjectInvitesQuery)
const { result: workspaceInviteResult } = useQuery(
  navigationWorkspaceInvitesQuery,
  null,
  { enabled: isWorkspacesEnabled.value }
)

const projectsInvites = computed(
  () => projectInviteResult.value?.activeUser?.projectInvites
)
const workspacesInvites = computed(() => {
  const invites = workspaceInviteResult.value?.activeUser?.workspaceInvites

  // Filter out implicit workspace invites that already show up as project invites here (same ID)
  return (
    invites?.filter((invite) => {
      return !projectsInvites.value?.some(
        (projectInvite) => projectInvite.id === invite.id
      )
    }) || []
  )
})

const hasNotifications = computed(
  () => projectsInvites.value?.length || workspacesInvites.value?.length
)
</script>
