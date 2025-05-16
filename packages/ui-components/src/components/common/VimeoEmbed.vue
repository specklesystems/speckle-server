<template>
  <div class="relative aspect-video w-full">
    <iframe
      :title="title"
      :src="`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=${
        isPlaying ? '1' : '0'
      }&muted=${muted ? '1' : '0'}&controls=${controls ? '1' : '0'}`"
      frameborder="0"
      allow="autoplay; fullscreen; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      class="w-full h-full"
    ></iframe>

    <button
      v-if="!isPlaying && (darkPlaceholder || lightPlaceholder)"
      class="group absolute top-0 left-0 w-full h-full flex items-center justify-center"
      @click="play"
    >
      <div
        class="absolute top-0 left-0 w-full h-full bg-foundation pointer-events-none"
      >
        <img
          v-if="darkPlaceholder"
          :src="darkPlaceholder"
          class="hidden dark:block w-full h-full object-cover"
          :alt="placeholderAlt || 'Play video'"
        />
        <img
          v-if="lightPlaceholder"
          :src="lightPlaceholder"
          class="dark:hidden w-full h-full object-cover"
          :alt="placeholderAlt || 'Play video'"
        />
      </div>
      <div
        class="relative z-10 bg-primary group-hover:bg-primary-focus h-28 w-28 rounded-full border-[4px] border-white flex items-center justify-center shadow-md"
      >
        <IconPlay class="h-10 w-10 ml-2 text-white" />
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconPlay from '../global/icon/Play.vue'

const emit = defineEmits<{
  (e: 'onPlay'): void
}>()

const props = defineProps<{
  vimeoId: string
  title: string
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  darkPlaceholder?: string
  lightPlaceholder?: string
  placeholderAlt?: string
}>()

const isPlaying = ref(props.autoplay || false)

const play = () => {
  isPlaying.value = true
  emit('onPlay')
}

defineExpose({
  play
})
</script>
