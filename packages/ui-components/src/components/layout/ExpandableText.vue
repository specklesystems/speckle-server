<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    v-keyboard-clickable
    class="relative flex flex-col bg-foundation-2 text-foreground-2 rounded-md p-4 w-full select-none"
    :class="isExpandable ? 'cursor-pointer' : 'cursor-default'"
    tabindex="0"
    role="button"
    :aria-expanded="isExpanded"
    @click="isExpandable ? toggleExpand() : undefined"
  >
    <div class="flex items-center gap-1 h-8 mb-1 shrink-0">
      <span class="text-body-xs font-medium">{{ title }}</span>
      <div v-if="isExpandable" class="flex items-center gap-1">
        <span class="sr-only">{{ isExpanded ? 'Collapse' : 'Expand' }}</span>
        <ArrowFilled :class="{ '-rotate-90': !isExpanded }" />
      </div>
    </div>
    <div
      ref="textElement"
      class="text-body-xs max-w-4xl duration-300"
      :class="{ 'line-clamp-2': !isExpanded && isExpandable }"
    >
      {{ text }}
    </div>
    <div
      v-if="!isExpanded && isExpandable"
      class="absolute z-10 bottom-0 left-0 w-full h-16 bg-gradient-to-t from-foundation-2"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import ArrowFilled from '~~/src/components/layout/sidebar/menu/group/ArrowFilled.vue'
import { vKeyboardClickable } from '~~/src/directives/accessibility'

const props = defineProps<{
  title: string
  text: string
}>()

const textElement = ref<HTMLElement | null>(null)
const isExpanded = ref(false)
const isExpandable = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const updateIsExpandable = () => {
  if (textElement.value) {
    isExpandable.value = textElement.value.scrollHeight > 48
  }
}

onMounted(updateIsExpandable)

watch(
  () => props.text,
  async () => {
    isExpanded.value = false
    await nextTick(updateIsExpandable)
  }
)
</script>
