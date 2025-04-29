<template>
  <div class="p-4">
    <div
      class="p-2 pl-3 bg-info-lighter rounded-md flex items-center justify-between gap-x-2"
    >
      <p class="text-primary-focus text-body-3xs font-semibold dark:text-foreground">
        You're on the Free plan
      </p>
      <FormButton
        size="sm"
        @click="navigateTo(settingsWorkspaceRoutes.billing.route(slug))"
      >
        Upgrade
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

defineProps<{
  slug: string
}>()
</script>
