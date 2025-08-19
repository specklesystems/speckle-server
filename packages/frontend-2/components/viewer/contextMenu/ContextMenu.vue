<template>
  <div
    v-if="shouldShowContextMenu"
    class="absolute pointer-events-auto z-50"
    :style="contextMenuState.style"
  >
    <div
      class="w-44 origin-top-right divide-y divide-outline-3 rounded-md bg-foundation shadow-lg border border-outline-2"
    >
      <div
        v-for="(group, groupIndex) in contextMenuItems"
        :key="groupIndex"
        class="p-1"
      >
        <button
          v-for="item in group"
          :key="item.id"
          :disabled="item.disabled || false"
          :class="buildButtonClasses(item)"
          @click="onItemChosen({ item })"
        >
          <Component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
          <div class="grow">{{ item.title }}</div>
        </button>
      </div>
    </div>
  </div>
  <div v-else />
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'
import { useViewerContextMenu } from '~~/lib/viewer/composables/contextMenu'

const props = defineProps<{
  parentEl: Nullable<HTMLElement>
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { contextMenuState, contextMenuItems, shouldShowContextMenu, onItemChosen } =
  useViewerContextMenu({
    parentEl: toRef(() => props.parentEl),
    isOpen
  })

const buildButtonClasses = (item: LayoutMenuItem) => {
  const classParts = [
    'group flex space-x-2 w-full items-center rounded-md px-2 py-1 text-body-xs text-left'
  ]

  if (item.disabled) {
    classParts.push('opacity-40 cursor-not-allowed')
  } else if (item.color === 'danger') {
    classParts.push('text-danger hover:bg-danger hover:text-foreground-on-primary')
  } else if (item.color === 'info') {
    classParts.push('text-info hover:bg-info hover:text-foreground-on-primary')
  } else {
    classParts.push('text-foreground hover:bg-primary-muted')
  }

  return classParts.join(' ')
}
</script>
