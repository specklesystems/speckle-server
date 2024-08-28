<template>
  <div class="flex flex-col">
    <div v-if="title" class="h-8 flex items-center justify-between select-none">
      <button
        v-if="collapsible"
        class="group flex space-x-1 items-center w-full rounded-md py-0.5 px-3"
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
        <h6 class="font-semibold text-foreground-2 text-xs truncate">
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
        class="hidden group-hover:block"
        @click="plusClick"
      >
        <Plus class="h-3 w-3" />
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
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import { ref, onMounted } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import Plus from '~~/src/components/layout/sidebar/menu/group/Plus.vue'

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
