<template>
  <div class="flex flex-col gap-4">
    <SidebarMenuGroup :items="dashboardItems">
      <template #dashboard>
        <HomeIcon class="h-5 w-5" />
      </template>
      <template #activity>
        <PresentationChartLineIcon class="h-5 w-5" />
      </template>
    </SidebarMenuGroup>

    <SidebarMenuGroup title="Workspaces" :items="workspacesItems">
      <template #default-space>
        <UserAvatar size="sm" :user="activeUser" hover-effect />
      </template>
      <template #profile>
        <UserAvatar size="sm" :user="activeUser" hover-effect />
      </template>
    </SidebarMenuGroup>

    <SidebarMenuGroup title="Favourites" :items="favouritesItems">
      <template #different-houses>
        <Squares2X2Icon class="h-5 w-5" />
      </template>
      <template #another-project>
        <Squares2X2Icon class="h-5 w-5" />
      </template>
      <template #the-palace>
        <CubeIcon class="h-5 w-5" />
      </template>
      <template #a-discussion-title>
        <ChatBubbleOvalLeftIcon class="h-5 w-5" />
      </template>
      <template #an-automation-name>
        <BoltIcon class="h-5 w-5" />
      </template>
    </SidebarMenuGroup>
  </div>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  CubeIcon,
  ChatBubbleOvalLeftIcon,
  BoltIcon
} from '@heroicons/vue/24/outline'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { homeRoute } from '~/lib/common/helpers/route'

const { activeUser } = useActiveUser()

const dashboardItems = computed<MenuItem[]>(() => [
  {
    label: 'Dashboard',
    id: 'dashboard',
    to: homeRoute
  },
  { label: 'Activity', id: 'activity', to: '/activity' }
])

const workspacesItems = computed<MenuItem[]>(() => [
  { label: "Benjamin's space", id: 'default-space', tag: 'Free', to: '/workspace' },
  { label: 'Acme Inc', id: 'profile', to: '/workspace' }
])

const favouritesItems = computed<MenuItem[]>(() => [
  { label: 'Different Houses', id: 'different-houses', to: '' },
  { label: 'Another Project', id: 'another-project', to: '' },
  { label: 'The Palace', id: 'the-palace', to: '' },
  { label: 'A discussion title', id: 'a-discussion-title', to: '' },
  { label: 'An automation name', id: 'an-automation-name', to: '' }
])
</script>
