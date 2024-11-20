<template>
  <div class="flex flex-col">
    <div
      v-if="title"
      class="h-8 flex items-center justify-between select-none rounded-md"
      :class="[collapsible && 'hover:bg-highlight-1']"
    >
      <button
        v-if="collapsible"
        class="group flex items-center w-full rounded-md py-0.5 px-2"
        @click="isCollapsed = !isCollapsed"
      >
        <ArrowFilled
          :class="[isCollapsed ? '-rotate-90' : '']"
          class="text-foreground-2 shrink-0"
        />
        <div
          v-if="$slots['title-icon']"
          class="flex items-center justify-center ml-1 mr-2"
        >
          <slot name="title-icon"></slot>
        </div>
        <div class="flex flex-1 items-center justify-between truncate">
          <h6 class="font-semibold text-foreground-2 truncate text-body-2xs pr-2">
            {{ title }}
          </h6>
          <CommonBadge v-if="tag" rounded>
            {{ tag }}
          </CommonBadge>
        </div>
      </button>
      <div v-else class="flex space-x-1 items-center w-full p-1 text-foreground-2 pl-2">
        <div v-if="$slots['title-icon']" class="flex items-center justify-center">
          <slot name="title-icon"></slot>
        </div>
        <div class="flex flex-1 items-center justify-between truncate">
          <h6 class="font-semibold text-foreground-2 truncate text-body-2xs pr-2">
            {{ title }}
          </h6>
          <CommonBadge v-if="tag" rounded>
            {{ tag }}
          </CommonBadge>
        </div>
      </div>
      <button
        v-if="plusClick"
        v-tippy="plusText ? plusText : undefined"
        class="hidden group-hover:flex p-[3px] shrink-0 hover:bg-primary-muted rounded mr-2 text-foreground-2"
        @click="plusClick"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>

    <div v-show="!isCollapsed" class="flex flex-col">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import ArrowFilled from '~~/src/components/layout/sidebar/menu/group/ArrowFilled.vue'
import Plus from '~~/src/components/layout/sidebar/menu/group/Plus.vue'
import CommonBadge from '~~/src/components/common/Badge.vue'

defineProps<{
  tag?: string
  title?: string
  collapsible?: boolean
  collapsed?: boolean
  plusText?: string
  plusClick?: () => void
}>()

const isCollapsed = defineModel<boolean>('collapsed')
</script>
