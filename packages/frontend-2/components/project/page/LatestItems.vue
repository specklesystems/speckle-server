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
          <h2 class="h4 font-bold transition group-hover:text-primary">
            {{ title }}
          </h2>

          <div
            class="text-foreground-2 text-xs flex items-center justify-center w-6 h-6 rounded-full p-2 bg-foundation group-hover:bg-primary group-hover:text-foreground-on-primary transition"
          >
            {{ count }}
          </div>
          <div class="invisible group-hover:visible transition text-xs">view all</div>
        </NuxtLink>
      </div>
      <!-- Right heading (filters, grid/list toggle) -->
      <div v-if="!hideFilters" class="flex space-x-4 items-center w-full lg:w-auto">
        <div class="grow lg:grow-0">
          <slot name="filters" />
        </div>
        <LayoutGridListToggle
          v-if="!hideGridListToggle"
          v-model="gridOrList"
          v-tippy="'Swap Grid/Card View'"
        />
      </div>
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
  hideGridListToggle?: boolean
  hideHeadingBottomMargin?: boolean
}>()

const gridOrList = useProjectPageItemViewType(props.title)
const headingClasses = computed(() => {
  const classes = ['flex flex-col space-y-2 justify-between lg:flex-row lg:space-y-0']
  if (!props.hideHeadingBottomMargin) {
    classes.push('mb-4')
  }

  return classes.join(' ')
})
</script>
