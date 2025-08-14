<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    ref="parent"
    class="relative w-full h-full"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @mousemove="(e: MouseEvent) => calculatePanoramaStyle(e)"
    @touchmove="(e: TouchEvent) =>
      calculatePanoramaStyle({
        target: e.target,
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      })"
  >
    <div v-if="shouldShowMainPreview" class="relative w-full h-full">
      <CommonTransitioningContents ref="finalPreviewTransitioner" class="w-full h-full">
        <div
          v-show="!hasDoneFirstLoad || !finalPreviewUrl?.length"
          :class="[
            mainPreviewClasses,
            'absolute inset-0 flex items-center justify-center bg-foundation-page rounded-xl'
          ]"
        >
          <CommonLoadingIcon class="opacity-50" />
        </div>
        <div
          :class="mainPreviewClasses"
          :style="{
            backgroundImage: `url('${finalPreviewUrl}')`
          }"
        />
      </CommonTransitioningContents>
    </div>
    <div
      v-show="shouldShowPanoramicPreview"
      ref="panorama"
      :style="{
        backgroundImage: panoramaPreviewUrl
          ? `url('${panoramaPreviewUrl}')`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: `${positionMagic}px 0`,
        position: 'absolute',
        top: '0',
        width: '100%',
        height: '100%'
      }"
    />
    <div class="absolute inset-0 flex items-end rounded-b-xl overflow-hidden">
      <CommonLoadingBar :loading="isLoadingPanorama && hovered" />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { CommonLoadingIcon } from '@speckle/ui-components'
import { useElementVisibility, useResizeObserver } from '@vueuse/core'
import { usePreviewImageBlob } from '~~/lib/projects/composables/previewImage'

type PanoramaStyleMouseOrTouchEvent = Pick<MouseEvent, 'target' | 'clientX' | 'clientY'>

const props = withDefaults(
  defineProps<{
    previewUrl: string
    panoramaOnHover?: boolean
  }>(),
  {
    panoramaOnHover: true
  }
)

const parent = ref(null as Nullable<HTMLDivElement>)
const finalPreviewTransitioner = ref(
  null as Nullable<{ triggerTransition: () => Promise<void> }>
)

const isInViewport = useElementVisibility(parent)
const basePreviewUrl = computed(() => props.previewUrl)
const {
  previewUrl: finalPreviewUrl,
  panoramaPreviewUrl,
  shouldLoadPanorama,
  isLoadingPanorama,
  hasDoneFirstLoad,
  isPanoramaPlaceholder
} = usePreviewImageBlob(basePreviewUrl, { enabled: isInViewport })

const hovered = ref(false)
const panorama = ref(null as Nullable<HTMLDivElement>)

const mainPreviewClasses = computed(
  () => 'w-full h-full bg-cover bg-no-repeat bg-center'
)

const parentWidth = ref(0)
const parentHeight = ref(0)
const setParentDimensions = () => {
  const { width = 0, height = 0 } = parent.value?.getBoundingClientRect() || {}
  parentWidth.value = width
  parentHeight.value = height
}

if (import.meta.client) useResizeObserver(document.body, () => setParentDimensions())

const positionMagic = ref(0)
const latestMouseEvent = ref<PanoramaStyleMouseOrTouchEvent>()
const calculatePanoramaStyle = (e: PanoramaStyleMouseOrTouchEvent) => {
  latestMouseEvent.value = e
  const rect = panorama.value?.getBoundingClientRect()
  if (parentHeight.value === 0) setParentDimensions()
  if (!rect) return

  const x = e.clientX - rect.left
  const step = rect.width / 24
  let index = Math.abs(24 - Math.round(x / step))
  if (index >= 24) index = 24 - 1

  const scaleFactor = parentHeight.value / 400
  const actualWidth = scaleFactor * 700
  const widthDiff = (parentWidth.value - actualWidth) * 0.5
  positionMagic.value = -(actualWidth * (2 * index + 1) - widthDiff)
}

const shouldShowMainPreview = computed(
  () =>
    (!hovered.value && finalPreviewUrl.value) ||
    isLoadingPanorama.value ||
    !props.panoramaOnHover ||
    isPanoramaPlaceholder.value
)
const shouldShowPanoramicPreview = computed(
  () =>
    hovered.value &&
    panoramaPreviewUrl.value &&
    props.panoramaOnHover &&
    !isPanoramaPlaceholder.value
)

onMounted(() => setParentDimensions())

watch(hovered, (newVal) => {
  if (newVal && !panoramaPreviewUrl.value && props.panoramaOnHover)
    shouldLoadPanorama.value = true
})

watch(
  () => unref(panoramaPreviewUrl),
  () => {
    if (latestMouseEvent.value) {
      calculatePanoramaStyle(latestMouseEvent.value)
    }
  }
)

if (import.meta.client) {
  // Trigger transitions when preview image changes
  watch(finalPreviewUrl, (newVal, oldVal) => {
    if (newVal === oldVal) return
    finalPreviewTransitioner.value?.triggerTransition()
  })
}
</script>
