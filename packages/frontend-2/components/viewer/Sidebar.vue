<template>
  <div
    ref="resizableElement"
    class="relative sm:absolute z-10 right-0 h-[50dvh] sm:h-[100dvh] overflow-hidden w-screen"
    :style="!isSmallerOrEqualSm ? { maxWidth: width + 'px' } : {}"
  >
    <div
      class="flex transition-all h-full"
      :class="open ? '' : 'sm:translate-x-[100%]'"
    >
      <!-- Resize Handle -->
      <div
        ref="resizeHandle"
        class="hidden sm:flex group relative z-10 hover:z-50 w-6 h-full items-center overflow-hidden"
      >
        <div
          class="w-5 h-8 bg-foundation group-hover:bg-outline-2 mt-8 rounded-l translate-x-4 group-hover:translate-x-0.5 transition cursor-ew-resize flex items-center justify-center shadow group-hover:shadow-xl"
          @mousedown="startResizing"
        >
          <ArrowsRightLeftIcon
            class="h-3 w-3 transition opacity-0 group-hover:opacity-80 text-outline-1"
          />
        </div>
        <div
          class="relative z-10 w-1 h-[100dvh] bg-transparent group-hover:bg-outline-2 cursor-ew-resize transition shadow-lg"
          @mousedown="startResizing"
        ></div>
      </div>
      <div
        class="flex flex-col bg-foundation w-full h-full relative z-20 overflow-hidden shadow-lg"
      >
        <!-- Header -->
        <div
          class="h-18 absolute z-10 top-0 w-full left-0 bg-foundation shadow-md"
          :class="isEmbedEnabled ? '' : 'sm:top-14'"
        >
          <div
            class="flex items-center justify-between pl-3 pr-2.5 h-10 border-b border-outline-3"
          >
            <div v-if="$slots.title" class="font-bold text-sm text-primary">
              <slot name="title"></slot>
            </div>
            <div class="flex items-center gap-0.5">
              <button
                v-if="width === 300"
                class="p-0.5 text-foreground hover:text-primary"
                @click="width = 600"
              >
                <ArrowLeftOnRectangleIcon class="h-4 w-4" />
              </button>
              <button
                v-else
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
        <div
          class="w-full"
          :class="
            isEmbedEnabled
              ? $slots.actions
                ? 'h-16'
                : 'h-10'
              : $slots.actions
              ? 'h-24 sm:h-32'
              : 'h-10'
          "
        ></div>
        <div
          class="overflow-y-auto simple-scrollbar h-[calc(50dvh)] sm:h-[calc(100dvh-8rem)] bg-foundation w-full pt-2"
        >
          <slot></slot>
        </div>
        <div
          v-if="$slots.footer"
          class="absolute z-20 bottom-0 h-8 bg-foundation shadow-t w-full flex items-center px-3 empty:translate-y-10 transition"
        >
          <slot name="footer"></slot>
        </div>
        <div v-if="$slots.footer" class="h-8"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import {
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ArrowsRightLeftIcon
} from '@heroicons/vue/24/outline'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'
import { useEmbed } from '~~/lib/viewer/composables/setup/embed'

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
const { isEnabled: isEmbedEnabled } = useEmbed()

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
