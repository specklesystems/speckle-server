<template>
  <div>
    <h1 class="block text-heading-xl mb-4 sm:mb-8">Settings</h1>
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
  projectCollaboratorsRoute,
  projectSettingsRoute,
  projectWebhooksRoute
} from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { Roles } from '@speckle/shared'

definePageMeta({
  middleware: ['can-view-settings']
})

graphql(`
  fragment ProjectPageSettingsTab_Project on Project {
    id
    role
  }
`)

const attrs = useAttrs() as {
  project: ProjectPageProjectFragment
}
const route = useRoute()
const router = useRouter()

const isOwner = computed(() => attrs.project.role === Roles.Stream.Owner)
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
    title: 'Collaborators',
    id: 'collaborators'
  },
  {
    title: 'Webhooks',
    id: 'webhooks',
    disabled: !isOwner.value,
    disabledMessage: !isOwner.value ? 'You must be the project owner' : undefined
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
      case 'collaborators':
        router.push(projectCollaboratorsRoute(projectId.value))
        break
      case 'webhooks':
        router.push(projectWebhooksRoute(projectId.value))
        break
      case 'general':
      default:
        router.push(projectSettingsRoute(projectId.value))
        break
    }
  }
})
</script>
