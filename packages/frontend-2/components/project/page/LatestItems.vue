<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="flex flex-col space-y-2 justify-between mb-4 lg:flex-row lg:space-y-0">
      <!-- Left heading (title, See All) -->
      <div
        class="flex flex-col items-start space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:space-x-2"
      >
        <div class="flex items-center space-x-2">
          <h2 class="h3 font-bold">
            {{ title }}
          </h2>
          <div class="h4 text-foreground-2">({{ count }})</div>
        </div>

        <FormButton text :to="seeAllUrl" @click="$emit('see-all-click', $event)">
          See all
        </FormButton>
      </div>
      <!-- Right heading (filters, grid/list toggle) -->
      <div v-if="!hideFilters" class="flex space-x-4 items-center w-full lg:w-auto">
        <div class="grow lg:grow-0">
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
  hideFilters?: boolean
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
