<template>
  <div>
    <HeaderNavBar />
    <div class="fixed top-0 left-0 h-dvh w-full overflow-hidden flex pt-14">
      <div ref="sidebar" class="relative" :style="{ width: sidebarWidth + 'px' }">
        <div
          class="bg-foundation overflow-y-auto overflow-x-hidden simple-scrollbar h-full"
        >
          <div class="p-4">
            <SidebarMain />
          </div>
        </div>

        <div
          ref="resizeHandle"
          class="group absolute right-0 top-0 h-full w-1.5 hover:cursor-ew-resize flex justify-end"
        >
          <div class="opacity-0 group-hover:opacity-100 h-full w-0.5 bg-primary"></div>
        </div>
      </div>

      <main class="flex-1 overflow-y-auto simple-scrollbar pt-8 pb-16">
        <div class="container mx-auto px-12">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

const sidebar = ref(null)
const resizeHandle = ref(null)
const isResizing = ref(false)
const sidebarWidth = ref(256) // Initial width (equivalent to w-64)
let startWidth = 0
let startX = 0

const startResizing = (event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  startX = event.clientX
  startWidth = sidebarWidth.value
}

if (import.meta.client) {
  useEventListener(resizeHandle, 'mousedown', startResizing)

  useEventListener(document, 'mousemove', (event) => {
    if (isResizing.value) {
      const diffX = event.clientX - startX
      sidebarWidth.value = Math.max(220, Math.min(startWidth + diffX, 400))
    }
  })

  useEventListener(document, 'mouseup', () => {
    if (isResizing.value) {
      isResizing.value = false
    }
  })
}
</script>
