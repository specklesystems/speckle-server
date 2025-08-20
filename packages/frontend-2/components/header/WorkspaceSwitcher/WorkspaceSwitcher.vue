<template>
  <div class="inline-block">
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: userOpen }" class="w-full">
        <span class="sr-only">Open workspace menu</span>
        <div class="flex items-center gap-2 p-0.5 pr-1.5 hover:bg-highlight-2 rounded">
          <div class="relative">
            <WorkspaceAvatar
              :name="activeWorkspace?.name || 'Personal projects'"
              :logo="activeWorkspace?.logo"
            />
            <div
              v-if="hasDiscoverableWorkspaces"
              class="absolute -top-[4px] -right-[4px] size-3 border-[2px] border-foundation-page bg-danger rounded-full"
            />
          </div>
          <p class="text-body-xs text-foreground truncate max-w-40">
            {{ activeWorkspace?.name || 'Personal projects' }}
          </p>
          <ChevronDownIcon
            :class="userOpen ? 'rotate-180' : ''"
            class="h-3 w-3 flex-shrink-0"
          />
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
          class="absolute left-2 lg:left-3 top-[3.2rem] lg:top-14 w-[17rem] origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden"
        >
          <HeaderWorkspaceSwitcherHeaderProjects v-if="!activeWorkspace" />
          <HeaderWorkspaceSwitcherHeaderSsoExpired
            v-else-if="ssoExpiredWorkspace"
            :workspace="ssoExpiredWorkspace"
          />
          <HeaderWorkspaceSwitcherHeaderWorkspace
            v-else-if="activeWorkspace.role"
            :workspace="fullActiveWorkspace"
            @open-invite-dialog="isInviteDialogOpen = true"
          />
          <HeaderWorkspaceSwitcherHeader
            v-else
            :name="activeWorkspace?.name"
            :logo="activeWorkspace?.logo"
            :to="workspaceRoute(activeWorkspace?.slug)"
          >
            <p class="text-body-xs text-foreground-2">
              You are not part of this workspace.
            </p>
          </HeaderWorkspaceSwitcherHeader>
          <HeaderWorkspaceSwitcherList class="border-t border-outline-2" />
          <MenuItem v-if="hasDiscoverableWorkspacesOrJoinRequests">
            <div class="p-2 border-t border-outline-2">
              <NuxtLink
                class="flex justify-between items-center cursor-pointer hover:bg-highlight-1 py-1 px-2 rounded"
                @click="showDiscoverableWorkspacesModal = true"
              >
                <p class="text-body-xs text-foreground">Join existing workspaces</p>
                <div class="relative">
                  <CommonBadge v-if="hasDiscoverableWorkspacesOrJoinRequests" rounded>
                    {{ discoverableWorkspacesAndJoinRequestsCount }}
                  </CommonBadge>
                  <div
                    v-if="hasDiscoverableWorkspaces"
                    class="absolute -top-[4px] -right-[4px] size-3 border-[2px] border-foundation-page bg-danger rounded-full"
                  />
                </div>
              </NuxtLink>
            </div>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>

    <InviteDialogWorkspace
      v-model:open="isInviteDialogOpen"
      :workspace="fullActiveWorkspace"
    />

    <WorkspaceDiscoverableWorkspacesModal
      v-model:open="showDiscoverableWorkspacesModal"
    />
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useQuery } from '@vue/apollo-composable'
import {
  navigationWorkspaceSwitcherQuery,
  workspaceSwitcherHeaderWorkspaceQuery
} from '~/lib/navigation/graphql/queries'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { WorkspaceJoinRequestStatus } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~/lib/common/generated/gql'
import { workspaceRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment WorkspaceSwitcherActiveWorkspace_LimitedWorkspace on LimitedWorkspace {
    id
    name
    logo
    slug
    role
  }
`)

graphql(`
  fragment WorkspaceSwitcherActiveWorkspace_User on User {
    id
    activeWorkspace {
      ...WorkspaceSwitcherActiveWorkspace_LimitedWorkspace
    }
    expiredSsoSessions {
      id
      ...HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspace
    }
    discoverableWorkspaces {
      id
    }
    workspaceJoinRequests(filter: $joinRequestFilter) {
      totalCount
    }
  }
`)

const { $intercom } = useNuxtApp()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const menuButtonId = useId()
const { result, onResult: onActiveWorkspaceResult } = useQuery(
  navigationWorkspaceSwitcherQuery,
  () => ({
    joinRequestFilter: {
      status: WorkspaceJoinRequestStatus.Pending
    }
  }),
  () => ({
    enabled: isWorkspacesEnabled.value
  })
)
// Seperate query to get the full workspace, because it's not always needed
const { result: fullWorkspaceResult } = useQuery(
  workspaceSwitcherHeaderWorkspaceQuery,
  () => ({
    slug: result.value?.activeUser?.activeWorkspace?.slug || ''
  }),
  {
    enabled:
      !!result.value?.activeUser?.activeWorkspace?.slug &&
      isWorkspacesEnabled.value &&
      !!result.value?.activeUser?.activeWorkspace?.role
  }
)

const showDiscoverableWorkspacesModal = ref(false)
const isInviteDialogOpen = ref(false)

const activeWorkspace = computed(() => result.value?.activeUser?.activeWorkspace)
const fullActiveWorkspace = computed(() => fullWorkspaceResult.value?.workspaceBySlug)
const ssoExpiredWorkspace = computed(() =>
  result.value?.activeUser?.expiredSsoSessions?.find(
    (session) => session.slug === activeWorkspace.value?.slug
  )
)
const hasDiscoverableWorkspaces = computed(
  () => (result.value?.activeUser?.discoverableWorkspaces?.length || 0) > 0
)
const discoverableWorkspacesAndJoinRequestsCount = computed(
  () =>
    (result.value?.activeUser?.discoverableWorkspaces?.length || 0) +
    (result.value?.activeUser?.workspaceJoinRequests?.totalCount || 0)
)
const hasDiscoverableWorkspacesOrJoinRequests = computed(
  () => discoverableWorkspacesAndJoinRequestsCount.value > 0
)

if (import.meta.client) {
  onActiveWorkspaceResult(({ data }) => {
    if (data?.activeUser?.activeWorkspace) {
      $intercom.updateCompany({
        id: data.activeUser.activeWorkspace.id,
        name: data.activeUser.activeWorkspace.name
      })
    }
  })
}
</script>
