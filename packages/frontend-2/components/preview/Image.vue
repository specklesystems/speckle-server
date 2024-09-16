<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
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
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-to-class="opacity-0"
      leave-active-class="transition duration-300"
    >
      <div v-if="shouldShowMainPreview" class="relative w-full h-full">
        <CommonTransitioningContents
          ref="finalPreviewTransitioner"
          class="w-full h-full"
        >
          <div
            v-if="!hasDoneFirstLoad || !finalPreviewUrl?.length"
            :class="[mainPreviewClasses, 'flex items-center justify-center']"
          >
            <div class="lds-ripple">
              <div></div>
              <div></div>
            </div>
          </div>
          <div
            v-else
            :class="mainPreviewClasses"
            :style="{
              backgroundImage: `url('${finalPreviewUrl}')`
            }"
          />
        </CommonTransitioningContents>
      </div>
    </Transition>
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-to-class="opacity-0"
      leave-active-class="transition duration-300"
    >
      <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
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
    </Transition>
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
    >
      <CommonLoadingBar
        :loading="isLoadingPanorama && hovered"
        class="absolute bottom-0 w-full"
      />
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { type Nullable } from '@speckle/shared'
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
  hasDoneFirstLoad
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
    !props.panoramaOnHover
)
const shouldShowPanoramicPreview = computed(
  () => hovered.value && panoramaPreviewUrl.value && props.panoramaOnHover
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
<style>
/** https://loading.io/css/ */

.lds-ripple {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}

.lds-ripple div {
  position: absolute;
  border: 4px solid #cef;
  opacity: 1;
  border-radius: 50%;
  animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}

.lds-ripple div:nth-child(2) {
  animation-delay: -0.5s;
}

@keyframes lds-ripple {
  0% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }

  4.9% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 0;
  }

  5% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 1;
  }

  100% {
    top: 0;
    left: 0;
    width: 72px;
    height: 72px;
    opacity: 0;
  }
}
</style>
