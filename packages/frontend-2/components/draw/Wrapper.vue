<template>
  <div ref="broccoli" class="relative min-h-screen flex flex-col z-20">
    <div class="relative flex-grow overflow-hidden">
      <CanvasInfinite :paper-id="'broccoli'" />
      <div class="fixed bottom-28">
        <CanvasToolbar :id="'broccoli'" @screenshot-clicked="console.log('')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCanvasStore, CanvasInfinite, CanvasToolbar } from '@speckle/draw'
import { useResizeObserver } from '@vueuse/core'

const canvasStore = useCanvasStore()
const broccoli = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })

onMounted(() => {
  const el = broccoli.value
  const upd = () => {
    if (!el) return
    size.w = el.clientWidth
    size.h = el.clientHeight
    canvasStore.updatePaperSize('broccoli', size)
  }
  upd()
  useResizeObserver(el, upd)
})
</script>
