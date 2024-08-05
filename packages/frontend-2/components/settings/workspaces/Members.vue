<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        hide-divider
        title="Members"
        text="Manage users in your workspace"
      />
      <LayoutTabsHoriztonal v-model:active-item="activeTab" :items="tabItems">
        <template #default="{ activeItem }">
          <SettingsWorkspacesMembersTable
            v-if="activeItem.id === 'members'"
            :workspace-id="workspaceId"
          />
          <div v-if="activeItem.id === 'guests'">Guests</div>
          <div v-if="activeItem.id === 'invites'">Pending invites</div>
        </template>
      </LayoutTabsHoriztonal>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LayoutTabItem } from '~~/lib/layout/helpers/components'
import { LayoutTabsHoriztonal } from '@speckle/ui-components'

defineProps<{
  workspaceId: string
}>()

const tabItems = ref<LayoutTabItem[]>([
  { title: 'Members', id: 'members' },
  { title: 'Guests', id: 'guests' },
  { title: 'Pending invites', id: 'invites' }
])

const activeTab = ref(tabItems.value[0])
</script>
