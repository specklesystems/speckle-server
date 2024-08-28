<template>
  <div class="flex flex-col">
    <div v-if="title" class="flex items-center justify-between select-none mb-1">
      <button
        v-if="collapsible"
        class="group flex space-x-1.5 items-center w-full rounded-md p-0.5"
        @click="isCollapsed = !isCollapsed"
      >
        <ChevronRightIcon
          :class="[
            isCollapsed ? '' : 'rotate-90',
            collapsible && $slots['title-icon'] ? 'ml-6' : ''
          ]"
          class="h-2.5 w-2.5"
        />
        <div
          v-if="$slots['title-icon']"
          class="h-5 w-5 flex items-center justify-center"
        >
          <slot name="title-icon"></slot>
        </div>
        <h6
          class="font-semibold text-foreground-2 text-xs flex items-center space-x-1.5 truncate"
        >
          {{ title }}
        </h6>
      </button>
      <div v-else class="flex space-x-1 items-center w-full p-1 text-foreground-2 pl-4">
        <div
          v-if="$slots['title-icon']"
          class="h-5 w-5 flex items-center justify-center"
        >
          <slot name="title-icon"></slot>
        </div>
        <h6 class="font-semibold text-xs truncate">
          {{ title }}
        </h6>
      </div>
      <FormButton
        v-if="plusClick"
        v-tippy="plusText ? plusText : undefined"
        color="subtle"
        size="sm"
        hide-text
        :icon-left="PlusIcon"
        @click="plusClick"
      >
        {{ plusText }}
      </FormButton>
    </div>

    <div
      v-show="!isCollapsed"
      class="flex flex-col"
      :class="collapsible && $slots['title-icon'] ? 'ml-6' : ''"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { ref, onMounted } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'

const props = defineProps<{
  title?: string
  collapsible?: boolean
  collapsed?: boolean
  plusText?: string
  plusClick?: () => void
}>()

const isCollapsed = ref(true)

onMounted(() => {
  isCollapsed.value = props.collapsed
})
</script>
