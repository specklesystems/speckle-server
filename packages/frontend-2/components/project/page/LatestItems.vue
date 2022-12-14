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
      <div class="flex space-x-4 items-center">
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
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { GridListToggleValue } from '~~/lib/layout/helpers/components'

defineEmits<{
  (e: 'see-all-click', v: MouseEvent): void
}>()

const props = defineProps<{
  title: string
  count: number
  seeAllUrl?: string
}>()

const viewTypeCookie = useSynchronizedCookie(`projectPage-${props.title}-viewType`)
const gridOrList = computed({
  get: () =>
    viewTypeCookie.value === GridListToggleValue.List
      ? GridListToggleValue.List
      : GridListToggleValue.Grid,
  set: (newVal) => (viewTypeCookie.value = newVal)
})
</script>
