<template>
  <div>
    <Menu as="div" class="flex items-center">
      <MenuButton :id="menuButtonId" v-slot="{ open: userOpen }" class="w-full">
        <span class="sr-only">Open workspace menu</span>
        <div class="flex items-center gap-2 p-0.5 pr-1.5 hover:bg-highlight-2 rounded">
          <template v-if="activeWorkspaceSlug || isProjectsActive">
            <div class="relative">
              <WorkspaceAvatar
                size="base"
                :name="displayName || ''"
                :logo="displayLogo"
              />
              <div
                v-if="hasDiscoverableWorkspaces"
                class="absolute -top-[4px] -right-[4px] size-3 border-[2px] border-foundation-page bg-danger rounded-full"
              />
            </div>
            <p class="text-body-xs text-foreground truncate max-w-40">
              {{ displayName }}
            </p>
          </template>
          <HeaderLogoBlock v-else no-link />
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
          class="absolute left-2 lg:left-3 top-[3.2rem] lg:top-14 w-[17rem] origin-top-right bg-foundation outline outline-1 outline-primary-muted rounded-md shadow-lg overflow-hidden divide-y divide-outline-2"
        >
          <HeaderWorkspaceSwitcherHeaderSsoExpired
            v-if="activeWorkspaceHasExpiredSsoSession"
            :workspace="expiredSsoWorkspaceData"
          />
          <HeaderWorkspaceSwitcherHeaderProjects v-else-if="isProjectsActive" />
          <HeaderWorkspaceSwitcherHeaderWorkspace
            v-else-if="!!activeWorkspace"
            :workspace="activeWorkspace"
            @show-invite-dialog="showInviteDialog = true"
          />
          <HeaderWorkspaceSwitcherList
            :workspaces="workspaces"
            :has-personal-projects="hasPersonalProjects"
          />
          <MenuItem v-if="hasDiscoverableWorkspacesOrJoinRequests">
            <div class="p-2">
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

    <WorkspaceDiscoverableWorkspacesModal
      v-model:open="showDiscoverableWorkspacesModal"
    />

    <InviteDialogWorkspace
      v-model:open="showInviteDialog"
      :workspace="activeWorkspace"
    />
  </div>
</template>
<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useDiscoverableWorkspaces } from '~/lib/workspaces/composables/discoverableWorkspaces'
import { graphql } from '~/lib/common/generated/gql'
import { useNavigation } from '~~/lib/navigation/composables/navigation'
import { useQuery } from '@vue/apollo-composable'

graphql(`
  fragment HeaderWorkspaceSwitcherActiveWorkspace_Workspace on Workspace {
    ...HeaderWorkspaceSwitcherHeaderWorkspace_Workspace
    ...InviteDialogWorkspace_Workspace
    id
    name
    logo
  }
`)

const headerWorkspaceSwitcherWorkspaceListQuery = graphql(`
  query HeaderWorkspaceSwitcherWorkspaceList($filter: UserProjectsFilter) {
    activeUser {
      id
      expiredSsoSessions {
        id
        ...HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspace
      }
      workspaces {
        items {
          id
          ...HeaderWorkspaceSwitcherWorkspaceListItem_Workspace
        }
      }
      projects(filter: $filter) {
        totalCount
      }
    }
  }
`)

const menuButtonId = useId()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const { activeWorkspaceSlug, isProjectsActive, activeWorkspaceData } = useNavigation()
const {
  hasDiscoverableWorkspaces,
  discoverableWorkspacesAndJoinRequestsCount,
  hasDiscoverableWorkspacesOrJoinRequests
} = useDiscoverableWorkspaces()
const { result } = useQuery(
  headerWorkspaceSwitcherWorkspaceListQuery,
  () => ({
    filter: {
      personalOnly: true
    }
  }),
  {
    enabled: isWorkspacesEnabled.value
  }
)

const showDiscoverableWorkspacesModal = ref(false)
const showInviteDialog = ref(false)

const expiredSsoSessions = computed(
  () => result.value?.activeUser?.expiredSsoSessions || []
)
const activeWorkspaceHasExpiredSsoSession = computed(
  () =>
    !!expiredSsoSessions.value.find(
      (session) => session.slug === activeWorkspaceSlug.value
    )
)
const expiredSsoWorkspaceData = computed(() =>
  expiredSsoSessions.value.find((session) => session.slug === activeWorkspaceSlug.value)
)
const activeWorkspace = computed(() => {
  return activeWorkspaceData.value
})
const workspaces = computed(() =>
  result.value?.activeUser
    ? result.value.activeUser.workspaces.items.filter(
        (workspace) => workspace.creationState?.completed !== false
      )
    : []
)
const hasPersonalProjects = computed(
  () => !!result.value?.activeUser?.projects?.totalCount
)
const displayName = computed(() =>
  isProjectsActive.value ? 'Personal projects' : activeWorkspace.value?.name
)
const displayLogo = computed(() =>
  isProjectsActive.value ? null : activeWorkspace.value?.logo
)
</script>
