<template>
  <div
    ref="resizableElement"
    class="relative sm:absolute z-10 right-0 sm:top-[4.2rem] h-[50dvh] sm:h-[calc(100dvh-4.2rem)] overflow-hidden w-screen sm:pr-3 sm:pb-3 sm:pt-0"
    :style="!isSmallerOrEqualSm ? { maxWidth: width + 'px' } : {}"
    :class="open ? '' : 'pointer-events-none'"
  >
    <div
      class="flex transition-all h-full"
      :class="open ? '' : 'sm:translate-x-[100%]'"
    >
      <!-- Resize Handle -->
      <div
        ref="resizeHandle"
        class="hidden sm:flex group relative z-30 hover:z-50 w-6 h-full items-center overflow-hidden -mr-1"
      >
        <div
          class="w-5 h-8 mr-1 bg-foundation group-hover:bg-outline-2 rounded-l translate-x-3 group-hover:translate-x-0.5 transition cursor-ew-resize flex items-center justify-center group-hover:shadow-xl"
          @mousedown="startResizing"
        >
          <ArrowsRightLeftIcon
            class="h-3 w-3 transition opacity-0 group-hover:opacity-80 text-outline-1 -ml-px"
          />
        </div>
        <div
          class="relative z-30 w-1 h-full pt-[4.2rem] -ml-1 bg-transparent group-hover:bg-outline-2 cursor-ew-resize transition rounded-l"
          @mousedown="startResizing"
        ></div>
      </div>
      <div
        class="flex flex-col w-full h-full relative z-20 overflow-hidden shadow-lg rounded-b-md"
      >
        <!-- Header -->
        <div
          class="h-18 absolute z-10 top-0 w-full left-0 bg-foundation shadow-md sm:rounded-t-md"
        >
          <div
            class="flex items-center justify-between pl-3 pr-2.5 h-10 border-b border-outline-3"
          >
            <div v-if="$slots.title" class="font-bold text-sm text-primary">
              <slot name="title"></slot>
            </div>
            <div class="flex items-center gap-0.5">
              <button class="p-0.5 text-foreground hover:text-primary" @click="onClose">
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div v-if="$slots.actions" class="w-full px-3 h-8">
            <div class="flex items-center gap-1 h-full">
              <slot name="actions"></slot>
            </div>
          </div>
        </div>

        <!-- Spacer to fill the relative space below the absolutely positioned header elements -->
        <div class="w-full" :class="$slots.actions ? 'h-24' : 'h-10'"></div>

        <div
          class="overflow-y-auto simple-scrollbar h-[calc(50dvh)] sm:h-[calc(100dvh-8rem)] bg-foundation w-full pt-2 sm:rounded-b-md"
        >
          <slot></slot>
        </div>
        <div
          v-if="$slots.footer"
          class="absolute z-20 bottom-0 h-8 bg-foundation shadow-t w-full flex items-center px-3 empty:translate-y-10 transition sm:rounded-b-md"
        >
          <slot name="footer"></slot>
        </div>
        <div v-if="$slots.footer" class="h-8"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { XMarkIcon, ArrowsRightLeftIcon } from '@heroicons/vue/24/outline'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const resizableElement = ref(null)
const resizeHandle = ref(null)
const isResizing = ref(false)
const width = ref(300)
let startWidth = 0
let startX = 0

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const startResizing = (event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  startX = event.clientX
  startWidth = width.value
}

useEventListener(resizeHandle, 'mousedown', startResizing)

useEventListener(document, 'mousemove', (event) => {
  if (isResizing.value) {
    const diffX = startX - event.clientX
    width.value = Math.max(
      300,
      Math.min(startWidth + diffX, (parseInt('75vw') * window.innerWidth) / 100)
    )
  }
})

useEventListener(document, 'mouseup', () => {
  if (isResizing.value) {
    isResizing.value = false
  }
})

const minimize = () => {
  width.value = 300
}

const onClose = () => {
  minimize()
  emit('close')
}
</script>
