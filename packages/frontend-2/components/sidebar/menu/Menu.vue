<template>
  <div class="flex flex-col gap-8">
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

const { activeUser } = useActiveUser()

interface MenuItem {
  label: string
  id: string
}

const dashboardItems = computed<MenuItem[]>(() => [
  { label: 'Dashboard', id: 'dashboard' },
  { label: 'Activity', id: 'activity' }
])

const workspacesItems = computed<MenuItem[]>(() => [
  { label: "Benjamin's space", id: 'default-space', tag: 'Free' },
  { label: 'Acme Inc', id: 'profile' }
])

const favouritesItems = computed<MenuItem[]>(() => [
  { label: 'Different Houses', id: 'different-houses' },
  { label: 'Another Project', id: 'another-project' },
  { label: 'The Palace', id: 'the-palace' },
  { label: 'A discussion title', id: 'a-discussion-title' },
  { label: 'An automation name', id: 'an-automation-name' }
])
</script>
