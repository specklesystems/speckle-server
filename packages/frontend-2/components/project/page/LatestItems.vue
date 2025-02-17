<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div :class="headingClasses">
      <!-- Left heading (title, See All) -->
      <div
        class="flex flex-col items-start space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:space-x-2"
      >
        <NuxtLink
          class="flex items-center space-x-2 group hover:cursor-pointer"
          :to="seeAllUrl"
        >
          <h2 class="h4 transition group-hover:text-primary">
            {{ title }}
          </h2>

          <div
            class="text-foreground-2 text-xs flex items-center justify-center group-hover:text-primary transition"
          >
            {{ count }}
          </div>
        </NuxtLink>
      </div>
      <!-- Right heading (filters, grid/list toggle) -->
      <slot v-if="!hideFilters" name="filters">
        <div class="flex space-x-4 items-center grow justify-end flex-wrap">
          <slot name="filters" />
          <LayoutGridListToggle v-model="gridOrList" />
        </div>
      </slot>
    </div>
    <!-- Main Content -->
    <div>
      <slot :grid-or-list="gridOrList" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useProjectPageItemViewType } from '~~/lib/projects/composables/projectPages'

const props = defineProps<{
  title: string
  count: number
  seeAllUrl?: string
  hideFilters?: boolean
  hideHeadingBottomMargin?: boolean
}>()

const gridOrList = useProjectPageItemViewType(props.title)
const headingClasses = computed(() => {
  const classes = ['flex flex-wrap']
  if (!props.hideHeadingBottomMargin) {
    classes.push('mb-4')
  }

  return classes.join(' ')
})
</script>
