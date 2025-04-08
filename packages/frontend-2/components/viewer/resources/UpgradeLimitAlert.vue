<template>
  <CommonAlert class="select-none" size="2xs" color="info" hide-icon :actions="actions">
    <template #description>{{ text }}</template>
  </CommonAlert>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'

defineProps<{
  text: string
}>()

const { activeWorkspaceSlug } = useNavigation()

const actions = computed((): AlertAction[] => [
  {
    title: 'Upgrade',
    onClick: () =>
      navigateTo(settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || ''))
  }
])
</script>
