<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: menuOpen }" as="div">
        <div
          class="relative cursor-pointer p-1 w-8 h-8 flex items-center justify-center hover:bg-highlight-2 rounded-md"
          :class="menuOpen ? 'border border-outline-2' : ''"
        >
          <span class="sr-only">Open notifications menu</span>
          <div v-if="!menuOpen">
            <div
              class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary animate-ping"
            ></div>
            <div
              class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"
            ></div>
          </div>

          <BellIcon v-if="!menuOpen" class="w-5 h-5" />
          <XMarkIcon v-else class="w-5 h-5" />
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
          class="absolute z-50 right-0 md:right-20 top-10 mt-1.5 w-full sm:w-64 bg-foundation-page outline outline-2 outline-primary-muted rounded-md shadow-lg overflow-y-auto simple-scrollbar select-none max-h-[70dvh]"
        >
          <div
            class="fixed z-10 w-full sm:w-64 h-10 text-heading-sm bg-foundation-page rounded-t-md p-2"
          >
            Notifications
          </div>
          <div class="h-10" />

          <!-- <div class="p-2 text-sm">TODO: project invites</div> -->
          <MenuItem>
            <AuthVerificationReminderMenuNotice />
          </MenuItem>

          <!-- Project Invites -->
          <MenuItem v-for="(invite, key) in projectInvites" :key="key" class="p-2">
            <div class="flex gap-2">
              <div><UserAvatar :user="invite.invitedBy" /></div>
              <div class="flex flex-col">
                <div class="text-body-2xs">
                  <span class="font-medium">
                    {{ invite.invitedBy.name }}
                  </span>
                  has invited you to join project
                  <span class="font-medium">
                    {{ invite.projectName }}
                  </span>
                </div>
                <div class="flex gap-1 mt-0.5">
                  <FormButton
                    size="sm"
                    text
                    color="outline"
                    class="opacity-80 hover:opacity-100"
                  >
                    Decline
                  </FormButton>
                  <FormButton size="sm" color="outline">Accept</FormButton>
                </div>
              </div>
            </div>
          </MenuItem>

          <!-- Workspace Invites -->
          <MenuItem v-for="(invite, key) in workspaceInvites" :key="key" class="p-2">
            <div class="flex gap-2">
              <div><UserAvatar :user="invite.invitedBy" /></div>
              <div class="flex flex-col">
                <div class="text-body-2xs">
                  <span class="font-medium">
                    {{ invite.invitedBy.name }}
                  </span>
                  has invited you to join project
                  <span class="font-medium">
                    {{ invite.workspaceName }}
                  </span>
                </div>
                <div class="flex gap-1 mt-0.5">
                  <FormButton
                    size="sm"
                    text
                    color="outline"
                    class="opacity-80 hover:opacity-100"
                  >
                    Decline
                  </FormButton>
                  <FormButton size="sm" color="outline">Accept</FormButton>
                </div>
              </div>
            </div>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { XMarkIcon, BellIcon } from '@heroicons/vue/24/outline'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

const headerNavNotificationBarQuery = graphql(`
  query HeaderNavNotificationBar {
    activeUser {
      projectInvites {
        id
        projectName
        invitedBy {
          id
          name
          avatar
        }
      }
      workspaceInvites {
        id
        workspaceName
        invitedBy {
          id
          name
          avatar
        }
      }
    }
  }
`)

const menuButtonId = useId()

const { result } = useQuery(headerNavNotificationBarQuery)

const projectInvites = computed(() => result.value?.activeUser?.projectInvites)
const workspaceInvites = computed(() => result.value?.activeUser?.workspaceInvites)
</script>
