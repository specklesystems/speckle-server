<template>
  <div>
    <!-- Current State -->
    <CommonCard class="!p-2 !pr-3 !border-outline-3 !bg-foundation-2">
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-full border border-outline-3 bg-foundation">
          <component :is="currentState.icon" class="w-5 h-5" />
        </div>
        <div class="flex flex-col">
          <div class="text-foreground">{{ currentState.title }}</div>
          <div class="text-foreground-2 text-body-2xs">
            {{ currentState.description }}
          </div>
        </div>
        <div class="ml-auto text-foreground-2 font-medium">Current</div>
      </div>
    </CommonCard>

    <!-- Arrow -->
    <div class="flex justify-center my-2">
      <ArrowDownIcon class="w-5 h-5 text-foreground-2" />
    </div>

    <!-- New State -->
    <CommonCard
      class="!p-2 !pr-3 !border-blue-300 !bg-blue-50 dark:!border-blue-800 dark:!bg-blue-950"
    >
      <div class="flex items-center gap-2">
        <div
          class="p-2.5 rounded-full border border-blue-300 dark:border-blue-800 bg-foundation"
        >
          <component :is="newState.icon" class="w-4 h-4" />
        </div>
        <div class="flex flex-col">
          <div class="text-foreground">{{ newState.title }}</div>
          <div class="text-foreground-2 text-body-2xs">
            {{ newState.description }}
          </div>
        </div>
        <slot name="price" />
      </div>
    </CommonCard>
  </div>
</template>

<script setup lang="ts">
import { ArrowDownIcon } from '@heroicons/vue/20/solid'
import type { ConcreteComponent } from 'vue'

type TransitionCard = {
  icon: ConcreteComponent
  title: string
  description: string
}

defineProps<{
  currentState: TransitionCard
  newState: TransitionCard
}>()
</script>
