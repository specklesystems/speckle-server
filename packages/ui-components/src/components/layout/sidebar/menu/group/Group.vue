<template>
  <div class="flex flex-col group">
    <div
      v-if="title"
      class="h-8 flex items-center justify-between select-none rounded-md"
      :class="[collapsible && !noHover && 'hover:bg-highlight-1']"
    >
      <component
        :is="collapsible ? 'button' : 'div'"
        class="flex items-center w-full"
        :class="[
          collapsible ? 'group rounded-md gap-x-1' : 'space-x-1 p-1 text-foreground-2',
          collapsible && !noHover ? 'py-0.5 px-2' : 'pl-2'
        ]"
        @click="collapsible ? (isCollapsed = !isCollapsed) : undefined"
      >
        <ArrowFilled
          v-if="collapsible"
          :class="[isCollapsed ? '-rotate-90' : '', noHover ? '-ml-1' : '']"
          class="text-foreground-2 shrink-0"
        />
        <div
          v-if="$slots['title-icon']"
          class="flex items-center justify-center"
          :class="[collapsible ? 'ml-1 mr-2' : '']"
        >
          <slot name="title-icon"></slot>
        </div>
        <div class="flex flex-1 items-center truncate justify-between">
          <h6
            class="truncate text-body-2xs pr-2"
            :class="[nested ? 'text-foreground' : 'font-semibold text-foreground-2']"
          >
            {{ title }}
          </h6>
          <CommonBadge v-if="tag" rounded>
            {{ tag }}
          </CommonBadge>
        </div>
      </component>
      <button
        v-if="iconClick"
        v-tippy="iconText ? iconText : undefined"
        class="hidden group-hover:flex p-1 shrink-0 hover:bg-primary-muted rounded text-foreground-2"
        :class="noHover ? '' : 'mr-2'"
        @click="iconClick"
      >
        <Edit v-if="icon === 'edit'" class="h-4 w-4" />
        <Plus v-else class="h-4 w-4" />
      </button>
    </div>

    <div v-show="!isCollapsed" class="flex flex-col">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import Plus from '~~/src/components/global/icon/Plus.vue'
import Edit from '~~/src/components/global/icon/Edit.vue'
import ArrowFilled from '~~/src/components/global/icon/ArrowFilled.vue'
import CommonBadge from '~~/src/components/common/Badge.vue'

defineProps<{
  tag?: string
  title?: string
  collapsible?: boolean
  collapsed?: boolean
  icon?: 'add' | 'edit'
  iconText?: string
  iconClick?: () => void
  noHover?: boolean
  nested?: boolean
}>()

const isCollapsed = defineModel<boolean>('collapsed')
</script>
