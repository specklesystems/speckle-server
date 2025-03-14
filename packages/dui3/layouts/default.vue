<template>
  <div class="relative min-h-screen flex flex-col">
    <HeaderNavBar />
    <main class="flex-1 px-1 max-[275px]:px-0" :class="hasNoModelCards ? '' : 'mt-10'">
      <slot />
    </main>
    <div
      v-if="hasNoModelCards"
      class="px-3 pt-1 text-tiny text-foreground-2 text-center"
    >
      Version {{ hostApp.connectorVersion }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHostAppStore } from '~/store/hostApp'

const hostApp = useHostAppStore()
const hasNoModelCards = computed(() => hostApp.projectModelGroups.length === 0)
</script>
