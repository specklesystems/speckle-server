<template>
  <div>
    <HeaderNavBar />
    <div class="h-dvh w-dvh overflow-hidden flex flex-col">
      <div class="h-14 w-full shrink-0"></div>
      <div class="relative flex h-[calc(100dvh-3.5rem)]">
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuGroup :items="dashboardItems">
              <template #dashboard>
                <HomeIcon class="size-5" />
              </template>
              <template #projects>
                <Squares2X2Icon class="size-5" />
              </template>
              <template #activity>
                <PresentationChartLineIcon class="size-5" />
              </template>
              <template #settings>
                <Cog6ToothIcon class="size-5" />
              </template>
            </SidebarMenuGroup>

            <SidebarMenuGroup collapsible title="Workspaces" :items="workspacesItems">
              <template #default-space>
                <UserAvatar size="sm" :user="activeUser" hover-effect class="ml-1" />
              </template>
              <template #profile>
                <UserAvatar size="sm" :user="activeUser" hover-effect class="ml-1" />
              </template>
            </SidebarMenuGroup>

            <SidebarMenuGroup title="Favourites" :items="favouritesItems" collapsible>
              <template #different-houses>
                <Squares2X2Icon class="size-5" />
              </template>
              <template #another-project>
                <Squares2X2Icon class="size-5" />
              </template>
              <template #the-palace>
                <CubeIcon class="size-5" />
              </template>
              <template #a-discussion-title>
                <ChatBubbleOvalLeftIcon class="size-5" />
              </template>
              <template #an-automation-name>
                <BoltIcon class="size-5" />
              </template>
            </SidebarMenuGroup>

            <SidebarMenuGroup
              title="Resources"
              :items="resourcesItems"
              :icon="ChatBubbleOvalLeftIcon"
            >
              <template #connectors>
                <PuzzlePieceIcon class="size-5" />
              </template>
              <template #community-forum>
                <UsersIcon class="size-5" />
              </template>
              <template #documentation>
                <BookOpenIcon class="size-5" />
              </template>
              <template #changelog>
                <HeartIcon class="size-5" />
              </template>
              <template #give-us-feedback>
                <ChatBubbleLeftIcon class="size-5" />
              </template>
            </SidebarMenuGroup>
          </SidebarMenu>
          <SidebarCallout />
        </Sidebar>

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
import {
  HomeIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  CubeIcon,
  ChatBubbleOvalLeftIcon,
  BoltIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
  UsersIcon,
  BookOpenIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/vue/24/outline'

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
