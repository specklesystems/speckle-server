<template>
  <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
  <div
    ref="parent"
    class="relative w-full h-full"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <ClientOnly>
      <div
        v-show="(!hovered && previewUrl) || isLoadingPanorama || !props.panoramaOnHover"
        class="w-full h-full bg-contain bg-no-repeat bg-center transition"
        :style="{
          backgroundImage: `url('${previewUrl}')`
        }"
      />
      <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
      <div
        v-show="hovered && panoramaPreviewUrl && props.panoramaOnHover"
        ref="panorama"
        :style="{
          backgroundImage: `url('${panoramaPreviewUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: `${positionMagic}px 0`,
          position: 'absolute',
          top: '0',
          width: '100%',
          height: '100%',
          opacity: hovered && panoramaPreviewUrl ? '1' : '0',
          transition: 'opacity 0.5s'
        }"
        @mousemove="(e: MouseEvent) => calculatePanoramaStyle(e)"
        @touchmove="(e:TouchEvent) =>
          calculatePanoramaStyle({
            target: e.target,
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
          } as MouseEvent)"
      />
      <CommonLoadingBar
        :loading="isLoadingPanorama && hovered"
        class="absolute bottom-0 w-full"
      />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useResizeObserver } from '@vueuse/core'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'

const props = withDefaults(
  defineProps<{
    previewUrl: string
    panoramaOnHover?: boolean
  }>(),
  {
    panoramaOnHover: true
  }
)

const basePreviewUrl = computed(() => props.previewUrl)
const { previewUrl, panoramaPreviewUrl, processPanoramaPreviewUrl, isLoadingPanorama } =
  usePreviewImageBlob(basePreviewUrl)

const hovered = ref(false)

watch(hovered, (newVal) => {
  if (newVal && !panoramaPreviewUrl.value && props.panoramaOnHover)
    processPanoramaPreviewUrl()
})

const panorama = ref(null as Nullable<HTMLDivElement>)
const parent = ref(null as Nullable<HTMLDivElement>)

let parentWidth = 1
let parentHeight = 1
const setParentDimensions = () => {
  parentWidth = parent.value?.getBoundingClientRect().width as number
  parentHeight = parent.value?.getBoundingClientRect().height as number
}
onMounted(() => setParentDimensions())
if (process.client) useResizeObserver(document.body, () => setParentDimensions())

const positionMagic = ref(0)
const calculatePanoramaStyle = (e: MouseEvent) => {
  const rect = panorama.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX - rect.left
  const step = rect.width / 24
  let index = Math.abs(24 - Math.round(x / step))
  if (index >= 24) index = 24 - 1

  const scaleFactor = parentHeight / 400
  const actualWidth = scaleFactor * 700
  const widthDiff = (parentWidth - actualWidth) * 0.5
  positionMagic.value = -(actualWidth * (2 * index + 1) - widthDiff)
}
</script>
