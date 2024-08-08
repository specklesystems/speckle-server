<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <div class="h-14 w-full shrink-0"></div>
      <div class="relative flex h-[calc(100dvh-3.5rem)]">
        <div class="h-full w-64 shrink-0">
          <LayoutSidebar>
            <LayoutSidebarMenu>
              <LayoutSidebarMenuGroup title="Dashboard">
                <template #title-icon>
                  <HomeIcon class="size-5" />
                </template>
                <LayoutSidebarMenuGroupItem
                  v-for="(item, key) in dashboardItems"
                  :key="key"
                  :label="item.label"
                  :to="item.to"
                />
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup collapsible title="Workspaces">
                <template #title-icon>
                  <UserAvatar size="sm" :user="activeUser" hover-effect class="ml-1" />
                </template>
                <LayoutSidebarMenuGroupItem
                  v-for="(item, key) in workspacesItems"
                  :key="key"
                  :label="item.label"
                  :to="item.to"
                  :tag="item.tag"
                />
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup title="Favourites" collapsible>
                <template #title-icon>
                  <HeartIcon class="size-5" />
                </template>
                <LayoutSidebarMenuGroupItem
                  v-for="(item, key) in favouritesItems"
                  :key="key"
                  :label="item.label"
                  :to="item.to"
                />
              </LayoutSidebarMenuGroup>

              <LayoutSidebarMenuGroup title="Resources">
                <template #title-icon>
                  <BookOpenIcon class="size-5" />
                </template>
                <LayoutSidebarMenuGroupItem
                  v-for="(item, key) in resourcesItems"
                  :key="key"
                  :label="item.label"
                  :to="item.to"
                  :external="item.external"
                />
              </LayoutSidebarMenuGroup>
            </LayoutSidebarMenu>
          </LayoutSidebar>
        </div>

        <main class="w-full h-full overflow-y-auto simple-scrollbar pt-8 pb-16">
          <div class="container mx-auto px-12">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HomeIcon, BookOpenIcon, HeartIcon } from '@heroicons/vue/24/outline'
import {
  LayoutSidebar,
  LayoutSidebarMenu,
  LayoutSidebarMenuGroup,
  LayoutSidebarMenuGroupItem
} from '@speckle/ui-components'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { homeRoute } from '~/lib/common/helpers/route'

const { activeUser } = useActiveUser()

const dashboardItems = computed(() => [
  {
    label: 'Dashboard',
    id: 'dashboard',
    to: homeRoute
  },
  { label: 'Projects', id: 'projects', to: '/projects' },
  { label: 'Activity', id: 'activity', to: '/activity' },
  { label: 'Settings', id: 'settings', to: '/settings' }
])

const workspacesItems = computed(() => [
  { label: "Benjamin's space", id: 'default-space', tag: 'Free', to: '/workspace' },
  { label: 'Acme Inc', id: 'profile', to: '/workspace' }
])

const favouritesItems = computed(() => [
  { label: 'Different Houses', id: 'different-houses', to: '' },
  { label: 'Another Project', id: 'another-project', to: '' },
  { label: 'The Palace', id: 'the-palace', to: '' },
  { label: 'A discussion title', id: 'a-discussion-title', to: '' },
  { label: 'An automation name', id: 'an-automation-name', to: '' }
])

const resourcesItems = computed(() => [
  {
    label: 'Connectors',
    id: 'connectors',
    to: 'https://speckle.systems/features/connectors/',
    external: true
  },
  {
    label: 'Community forum',
    id: 'community-forum',
    to: 'https://speckle.community/',
    external: true
  },
  {
    label: 'Documentation',
    id: 'documentation',
    to: 'https://speckle.guide/',
    external: true
  },
  { label: 'Changelog', id: 'changelog', to: '', external: true },
  { label: 'Give us feedback', id: 'give-us-feedback', to: '' }
])
</script>
