<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    ref="resizableElement"
    class="relative sm:absolute z-10 right-0 overflow-hidden w-screen bottom-0 sm:bottom-auto sm:top-[3.5rem] lg:top-[3rem] sm:right-2 lg:right-0 h-[40dvh] sm:h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-3rem)]"
    :style="!isSmallerOrEqualSm ? { maxWidth: width + 'px' } : {}"
    :class="[open ? '' : 'pointer-events-none']"
  >
    <div class="flex h-full" :class="open ? '' : 'sm:translate-x-[100%]'">
      <!-- Resize Handle -->
      <div
        ref="resizeHandle"
        class="absolute h-full max-h-[calc(100dvh-3rem)] w-4 transition border-l sm:rounded-lg lg:rounded-none hover:border-l-[2px] border-outline-2 hover:border-primary hidden sm:flex items-center cursor-ew-resize z-30"
        @mousedown="startResizing"
      />

      <div
        class="flex flex-col w-full h-full relative z-20 overflow-hidden sm:rounded-lg lg:rounded-none border-l sm:border lg:border-0 lg:border-l border-outline-2 bg-foundation"
      >
        <div
          class="h-10 pl-4 pr-2 flex items-center justify-between border-b border-outline-2"
        >
          <div class="text-body-xs text-foreground font-medium">
            <slot name="title" />
          </div>
          <slot name="actions" />
        </div>
        <div class="simple-scrollbar overflow-y-auto h-full flex-1">
          <slot />
        </div>
        <div v-if="$slots.footer" class="py-2 px-4 border-t border-outline-2">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
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
const width = ref(280)
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
        280,
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
</script>
