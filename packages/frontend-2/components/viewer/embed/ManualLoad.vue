<template>
  <div>
    <button
      class="group flex items-center justify-center absolute inset-0"
      @click="$emit('play')"
    >
      <div v-if="previewUrl" class="absolute inset-0">
        <PreviewImage :preview-url="previewUrl" />
      </div>
      <div
        class="relative z-10 pointer-events-none group-hover:scale-110 group-hover:shadow-xl shadow h-14 w-14 rounded-full border border-foundation bg-primary flex items-center justify-center transition -mt-10"
      >
        <PlayIcon class="h-6 w-6 ml-[3px] text-foundation" />
      </div>
    </button>
    <ViewerEmbedFooter :url="projectUrl" name="View in Speckle" />
  </div>
</template>

<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/20/solid'

const route = useRoute()
const {
  public: { apiOrigin }
} = useRuntimeConfig()

const projectUrl = route.path

const projectId = route.params.id as string
const modelId = route.params.modelId as string

const previewUrl = computed(() => {
  if (modelId) {
    const url = new URL(`/preview/${projectId}/commits/${modelId}`, apiOrigin)
    return url.toString()
  } else if (projectId) {
    const url = new URL(`/preview/${projectId}`, apiOrigin)
    return url.toString()
  } else return null
})

defineEmits<{
  (e: 'play'): void
}>()
</script>
