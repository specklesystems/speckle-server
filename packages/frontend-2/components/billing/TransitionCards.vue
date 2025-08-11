<template>
  <div>
    <!-- Current State -->
    <CommonCard class="!p-2 !pr-3 !border-outline-3 !bg-foundation-2">
      <slot name="current-state" />
    </CommonCard>

    <!-- Arrow -->
    <div class="flex justify-center my-2">
      <ArrowDown
        :size="LucideSize.lg"
        :stroke-width="1.5"
        :absolute-stroke-width="true"
        class="text-foreground-2"
      />
    </div>

    <!-- New State -->
    <CommonCard
      class="!p-2 !pr-3 !border-blue-200 !bg-blue-50 dark:!border-blue-800 dark:!bg-blue-950"
    >
      <slot name="new-state" />
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'
</script>
