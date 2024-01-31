<template>
  <div
    ref="resizableElement"
    class="relative sm:absolute z-10 right-0 h-[50dvh] sm:h-[100dvh] overflow-hidden w-screen transition-all flex"
    :style="!isSmallerOrEqualSm ? { maxWidth: width + 'px' } : {}"
    :class="open ? '' : 'sm:translate-x-[100%]'"
  >
    <!-- Resize Handle -->
    <div
      ref="resizeHandle"
      class="relative z-10 hover:z-50 w-1 h-full bg-foundation hover:bg-outline-2 cursor-ew-resize shadow-lg"
      @mousedown="startResizing"
    ></div>
    <div class="flex flex-col bg-foundation shadow-lg w-full h-full">
      <!-- Header -->
      <div
        class="h-18 absolute z-10 w-full top-0 sm:top-14 right-0 bg-foundation shadow-md"
      >
        <div
          class="flex items-center justify-between pl-3 pr-2.5 h-10 border-b border-outline-2"
        >
          <div v-if="$slots.title" class="font-bold text-sm text-primary">
            <slot name="title"></slot>
          </div>
          <div class="flex items-center gap-0.5">
            <button
              v-if="width !== 300"
              class="p-0.5 text-foreground hover:text-primary"
              @click="minimize"
            >
              <ArrowRightOnRectangleIcon class="h-4 w-4" />
            </button>
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
      <div class="w-full" :class="$slots.actions ? 'h-16 sm:h-32' : 'h-26'"></div>
      <div
        class="overflow-y-auto simple-scrollbar h-[calc(50dvh-8rem)] sm:h-[calc(100dvh-8rem)] bg-foundation w-full pt-2"
      >
        <slot></slot>
      </div>
      <div
        v-if="$slots.footer"
        class="absolute z-20 bottom-0 left-0 w-full h-8 bg-foundation shadow-t flex items-center px-3 empty:translate-y-10 transition"
      >
        <slot name="footer"></slot>
      </div>
      <div v-if="$slots.footer" class="h-8"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { XMarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const resizableElement = ref(null)
const width = ref(300)
let startWidth = 0
let startX = 0

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const startResizing = (event: MouseEvent) => {
  event.preventDefault()

  const element = resizableElement.value as HTMLElement | null
  if (element) {
    element.classList.remove('transition-all')
  }

  startX = event.clientX
  startWidth = width.value

  document.addEventListener('mousemove', resizing)
  document.addEventListener('mouseup', stopResizing)
}

const resizing = (event: MouseEvent) => {
  const diffX = startX - event.clientX
  width.value = Math.max(
    300,
    Math.min(startWidth + diffX, (parseInt('75vw') * window.innerWidth) / 100)
  )
}

const stopResizing = () => {
  document.removeEventListener('mousemove', resizing)
  document.removeEventListener('mouseup', stopResizing)
  const element = resizableElement.value as HTMLElement | null
  if (element) {
    element.classList.add('transition-all')
  }
}

const minimize = () => {
  width.value = 300
}

const onClose = () => {
  minimize()
  emit('close')
}

onUnmounted(() => {
  document.removeEventListener('mousemove', resizing)
  document.removeEventListener('mouseup', stopResizing)
})
</script>
