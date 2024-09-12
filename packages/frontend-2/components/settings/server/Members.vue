<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Members"
        text="Manage members on your server"
        hide-divider
      />

      <div class="mt-6">
        <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
          <template #default="{ activeItem }">
            <SettingsServerActiveUsers v-if="activeItem.id === 'members'" />
            <SettingsServerPendingInvitations v-if="activeItem.id === 'invites'" />
          </template>
        </LayoutTabsHorizontal>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LayoutPageTabItem } from '~~/lib/layout/helpers/components'

const tabItems = computed<LayoutPageTabItem[]>(() => [
  { title: 'Members', id: 'members' },
  { title: 'Pending invites', id: 'invites' }
])

const activeTab = ref(tabItems.value[0])
</script>
