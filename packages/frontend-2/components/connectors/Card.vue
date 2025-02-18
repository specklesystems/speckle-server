<template>
  <NuxtLink :to="connector.url" target="_blank" class="flex">
    <CommonCard
      class="flex flex-1 flex-col gap-1 !p-4 !pt-2 !pb-3 hover:border-outline-2"
    >
      <div class="flex gap-2 items-center">
        <img
          v-if="connector.image"
          :src="connector.image"
          :alt="`${connector.title} logo`"
          class="w-[48px] -ml-1"
        />
        <h2 class="text-body-xs text-foreground font-medium">
          {{ connector.title }}
        </h2>
      </div>
      <p class="text-body-2xs text-foreground-2 line-clamp-5 leading-5">
        {{ connector.description }}
      </p>
    </CommonCard>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ConnectorItem } from '~~/lib/dashboard/helpers/types'

defineProps<{
  connector: ConnectorItem
}>()
</script>
