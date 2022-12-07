<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="flex justify-between mb-4">
      <!-- Left heading (title, See All) -->
      <div class="flex items-center space-x-2">
        <h2 class="h2 font-bold">
          {{ title }}
        </h2>
        <div class="h3 text-foreground-2">({{ count }})</div>
        <FormButton link :to="seeAllUrl" @click="$emit('see-all-click', $event)">
          See all
        </FormButton>
      </div>
      <!-- Right heading (filters, grid/list toggle) -->
      <div class="flex space-x-4">
        <div>
          <slot name="filters" />
        </div>
        <LayoutGridListToggle v-model="gridOrList" />
      </div>
    </div>
    <!-- Main Content -->
    <div>
      <slot :grid-or-list="gridOrList" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

defineEmits<{
  (e: 'see-all-click', v: MouseEvent): void
}>()

defineProps<{
  title: string
  count: number
  seeAllUrl?: string
}>()

const gridOrList = ref(GridListToggleValue.Grid)
</script>
