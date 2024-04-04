<template>
  <div>
    <h1 class="block h4 font-bold mb-8">Settings</h1>
    <LayoutPageTabs
      v-model:active-item="activeSettingsPageTab"
      vertical
      :items="settingsTabItems"
    >
      <template #default="{ activeItem }">
        <ProjectPageSettingsGeneral v-if="activeItem.id === 'general'" />
        <ProjectPageSettingsCollaborators v-if="activeItem.id === 'collaborators'" />
        <ProjectPageSettingsWebhooks v-if="activeItem.id === 'webhooks'" />
      </template>
    </LayoutPageTabs>
  </div>
</template>
<script setup lang="ts">
import { LayoutPageTabs, type LayoutPageTabItem } from '@speckle/ui-components'
import { UsersIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import IconWebhooks from '~~/components/global/icon/Webhooks.vue'

const settingsTabItems = computed((): LayoutPageTabItem[] => [
  {
    title: 'General',
    id: 'general',
    icon: Cog6ToothIcon
  },
  {
    title: 'Collaborators',
    id: 'collaborators',
    icon: UsersIcon
  },
  {
    title: 'Webhooks',
    id: 'webhooks',
    icon: IconWebhooks
  }
])

const activeSettingsPageTab = ref(settingsTabItems.value[0])
</script>
