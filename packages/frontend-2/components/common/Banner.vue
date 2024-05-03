<template>
  <!--
    Banner Component has been built for the hackathon, but as new events
    are added and the banners desiged, this can be modified to allow new styles
  -->
  <div
    class="p-6 lg:p-8 bg-[#27272a] text-white rounded-xl w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-2 select-none"
  >
    <div class="flex flex-col lg:flex-row gap-2 lg:gap-6 items-start lg:items-center">
      <img :src="imagePath" :alt="primaryText" class="h-10 lg:h-auto" />
      <div class="flex flex-col sm:flex-row sm:gap-1">
        <span class="font-semibold">{{ primaryText }}</span>
        <span v-if="secondaryText">{{ secondaryText }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <a :href="url" target="_blank">
        <button
          class="bg-white/90 hover:bg-white border border-transparent rounded py-1 px-2.5 text-[#27272a] font-semibold text-sm sm:text-base"
        >
          Learn more
        </button>
      </a>

      <button
        class="bg-transparent hover:bg-white/10 border border-white rounded py-1 px-2.5 text-white text-sm sm:text-base"
        @click="dismissBanner"
      >
        Close
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'

const props = defineProps<{
  id: string
  primaryText: string
  secondaryText?: Optional<string>
  imageFilename: string
  url: string
}>()

const emit = defineEmits<{
  (e: 'banner-dismissed', id: string): void
}>()

const imagePath = computed(() => `~~/assets/images/banners/${props.imageFilename}`)

function dismissBanner() {
  emit('banner-dismissed', props.id)
}
</script>
