<template>
  <div class="mt-3">
    <h1 class="block text-heading-lg mb-4 sm:mb-8">Settings</h1>
    <LayoutTabsVertical
      v-model:active-item="activeSettingsPageTab"
      :items="settingsTabItems"
    >
      <NuxtPage />
    </LayoutTabsVertical>
  </div>
</template>
<script setup lang="ts">
import { LayoutTabsVertical, type LayoutPageTabItem } from '@speckle/ui-components'
import {
  projectSettingsRoute,
  projectWebhooksRoute,
  projectTokensRoute
} from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsTab_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

definePageMeta({
  middleware: ['can-view-settings']
})

graphql(`
  fragment ProjectPageSettingsTab_Project on Project {
    id
    name
    permissions {
      canReadWebhooks {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const attrs = useAttrs() as {
  project: ProjectPageSettingsTab_ProjectFragment
}
const route = useRoute()
const router = useRouter()

const canReadWebhooks = computed(() => attrs.project.permissions.canReadWebhooks)
const projectName = computed(() =>
  attrs.project.name.length ? attrs.project.name : ''
)

useHead({
  title: `Settings | ${projectName.value}`
})

const settingsTabItems = computed((): LayoutPageTabItem[] => [
  {
    title: 'General',
    id: 'general'
  },
  {
    title: 'Webhooks',
    id: 'webhooks',
    disabled: !canReadWebhooks.value.authorized,
    disabledMessage: canReadWebhooks.value.message
  },
  {
    title: 'Tokens',
    id: 'tokens',
    disabled: !canReadWebhooks.value.authorized,
    disabledMessage: canReadWebhooks.value.message
  }
])

const projectId = computed(() => route.params.id as string)

const activeSettingsPageTab = computed({
  get: () => {
    const path = route.path
    if (path.includes('/settings/webhooks')) return settingsTabItems.value[1]
    if (path.includes('/settings/tokens')) return settingsTabItems.value[2]
    return settingsTabItems.value[0]
  },
  set: (val: LayoutPageTabItem) => {
    switch (val.id) {
      case 'webhooks':
        router.push(projectWebhooksRoute(projectId.value))
        break
      case 'tokens':
        router.push(projectTokensRoute(projectId.value))
        break
      case 'general':
      default:
        router.push(projectSettingsRoute(projectId.value))
        break
    }
  }
})
</script>
