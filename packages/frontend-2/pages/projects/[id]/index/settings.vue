<template>
  <div>
    <h1 class="block h4 font-bold mb-8">Settings</h1>
    <LayoutPageTabs
      v-model:active-item="activeSettingsPageTab"
      vertical
      :items="settingsTabItems"
    >
      <NuxtPage />
    </LayoutPageTabs>
  </div>
</template>
<script setup lang="ts">
import { LayoutPageTabs, type LayoutPageTabItem } from '@speckle/ui-components'
import { UsersIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import IconWebhooks from '~~/components/global/icon/Webhooks.vue'
import {
  projectCollaboratorsRoute,
  projectSettingsRoute,
  projectWebhooksRoute
} from '~~/lib/common/helpers/route'

const route = useRoute()
const router = useRouter()

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

const projectId = computed(() => route.params.id as string)

const activeSettingsPageTab = computed({
  get: () => {
    const path = route.path
    if (path.includes('/settings/collaborators')) return settingsTabItems.value[1]
    if (path.includes('/settings/webhooks')) return settingsTabItems.value[2]
    return settingsTabItems.value[0]
  },
  set: (val: LayoutPageTabItem) => {
    switch (val.id) {
      case 'general':
        router.push(projectSettingsRoute(projectId.value))
        break
      case 'collaborators':
        router.push(projectCollaboratorsRoute(projectId.value))
        break
      case 'webhooks':
        router.push(projectWebhooksRoute(projectId.value))
        break
      default:
        router.push(projectSettingsRoute(projectId.value))
    }
  }
})
</script>
