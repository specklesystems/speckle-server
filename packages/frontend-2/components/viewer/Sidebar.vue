<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    ref="resizableElement"
    class="relative sm:absolute z-10 right-0 overflow-hidden w-screen top-[3rem] sm:h-[calc(100dvh-3rem)]"
    :style="!isSmallerOrEqualSm ? { maxWidth: width + 'px' } : {}"
    :class="[open ? '' : 'pointer-events-none']"
  >
    <div class="flex h-full" :class="open ? '' : 'sm:translate-x-[100%]'">
      <!-- Resize Handle -->
      <div
        ref="resizeHandle"
        class="absolute h-full max-h-[calc(100dvh-3rem)] w-4 transition border-l hover:border-l-[2px] border-outline-2 hover:border-primary hidden sm:flex items-center cursor-ew-resize z-30"
        @mousedown="startResizing"
      />

      <div
        class="flex flex-col w-full h-full relative z-20 overflow-hidden border-l border-outline-2"
      >
        <div
          class="h-[6.5rem] absolute z-10 top-0 w-full left-0 bg-foundation border-b border-outline-2"
        >
          <div
            class="flex items-center justify-between py-1.5 pl-3 pr-1 border-b border-outline-2"
          >
            <div v-if="$slots.title" class="text-body-xs text-foreground font-semibold">
              <slot name="title"></slot>
            </div>

            <FormButton
              hide-text
              :icon-left="XMarkIcon"
              size="sm"
              color="subtle"
              @click="onClose"
            />
          </div>
          <div v-if="$slots.actions" class="w-full">
            <slot name="actions"></slot>
          </div>
        </div>
        <div class="w-full" :class="$slots.actions ? 'h-[7rem]' : 'h-10'"></div>
        <div
          class="overflow-y-auto simple-scrollbar h-full bg-foundation w-full pt-2 sm:rounded-b-md max-h-[220px] sm:max-h-none"
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'width-change', width: number): void
}>()

const resizableElement = ref(null)
const resizeHandle = ref(null)
const isResizing = ref(false)
const width = ref(240)
let startWidth = 0
let startX = 0

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const startResizing = (event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  startX = event.clientX
  startWidth = width.value
}

if (import.meta.client) {
  useEventListener(resizeHandle, 'mousedown', startResizing)

  useEventListener(document, 'mousemove', (event) => {
    if (isResizing.value) {
      const diffX = startX - event.clientX
      const newWidth = Math.max(
        240,
        Math.min(startWidth + diffX, Math.min(440, window.innerWidth * 0.5 - 60))
      )
      width.value = newWidth
      emit('width-change', newWidth)
    }
  })

  useEventListener(document, 'mouseup', () => {
    if (isResizing.value) {
      isResizing.value = false
    }
  })
}

onMounted(() => {
  emit('width-change', width.value)
})

const minimize = () => {
  width.value = 240
  emit('width-change', 240)
}

const onClose = () => {
  minimize()
  emit('close')
}
</script>
