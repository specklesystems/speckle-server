<template>
  <div class="relative min-h-screen flex flex-col">
    <CanvasPaperLogoBlock />
    <div ref="screenshotContainer" class="relative flex-grow overflow-hidden">
      <!-- TODO: Implement thumbnail generation from viewer actions, pan, zoom, navigation -->
      <!-- <ViewerBase :id="id" :size="size" @view-changed="queueSaveThumb()" />
      <CanvasPaper :id="id" :size="size" @changed="queueSaveThumb()" /> -->
      <CanvasInfinite :paper-id="id" />
    </div>
    <CanvasToolbar :id="id" @screenshot-clicked="takeFullScreenshot" />
  </div>
</template>

<script setup lang="ts">
import html2canvas from 'html2canvas'
const route = useRoute()
const store = useCanvasStore()

const screenshotContainer = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })

const id = route.params.id as string

const takeFullScreenshot = async () => {
  if (!screenshotContainer.value) return

  const canvas = await html2canvas(screenshotContainer.value, {
    useCORS: true
  })

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  )

  if (!blob) return

  const url = URL.createObjectURL(blob)
  console.log(url)

  const link = document.createElement('a')
  link.href = url
  link.download = 'drawing-screenshot.png'
  link.click()
  URL.revokeObjectURL(url)
}

async function captureCompositeThumb(): Promise<string | null> {
  if (!screenshotContainer.value) return null
  const c = await html2canvas(screenshotContainer.value, { useCORS: true })
  return c.toDataURL('image/webp', 0.8) // TODO: quality value is arbitrary, need to check performance implications later
}

// Debounced saver
let t: number | null = null
const queueSaveThumb = (delay = 200) => {
  console.log('Saving thumbnail...')
  if (t) window.clearTimeout(t)
  t = window.setTimeout(async () => {
    const dataUrl = await captureCompositeThumb()
    if (!dataUrl) return
    store.setLiveSnapshotThumb(id, dataUrl)
  }, delay)
}

onMounted(() => {
  queueSaveThumb(80)

  if (!screenshotContainer.value) return
  const el = screenshotContainer.value
  const upd = () => {
    size.w = el.clientWidth
    size.h = el.clientHeight
    store.updatePaperSize(id, size)
  }
  upd()
  useResizeObserver(el, upd)

  const canvasStore = useCanvasStore()
  const { activePaperId } = storeToRefs(canvasStore)
  activePaperId.value = id
})
</script>
