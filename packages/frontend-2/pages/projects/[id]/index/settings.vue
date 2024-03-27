<template>
  <div>
    <h1 class="block h4 font-bold mb-8">Settings</h1>
    <LayoutPageTabs
      v-model:active-item="activeSettingsPageTab"
      vertical
      :items="settingsTabItems"
    >
      <!-- Default slot for tab content -->
      <template #default="{ activeItem }">
        <ProjectPageSettingsGeneral v-if="activeItem.id === 'general'" />
        <ProjectPageSettingsCollaborators v-if="activeItem.id === 'collaborators'" />
        <ProjectPageSettingsWebhooks v-if="activeItem.id === 'webhooks'" />
      </template>

      <!-- Named slots for icons -->
      <template #icon-general>
        <Cog6ToothIcon class="h-5 w-5" />
      </template>

      <template #icon-collaborators>
        <UsersIcon class="h-5 w-5" />
      </template>

      <template #icon-webhooks>
        <IconWebhooks class="h-5 w-5" />
      </template>
    </LayoutPageTabs>
  </div>
</template>
<script setup lang="ts">
import { LayoutPageTabs, type LayoutPageTabItem } from '@speckle/ui-components'
import { UsersIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'

const settingsTabItems = computed((): LayoutPageTabItem[] => [
  {
    title: 'General',
    id: 'general'
  },
  {
    title: 'Collaborators',
    id: 'collaborators'
  },
  {
    title: 'Webhooks',
    id: 'webhooks'
  }
])

const activeSettingsPageTab = ref(settingsTabItems.value[0])
</script>
