<template>
  <button
    class="group flex items-center justify-center absolute inset-0"
    @click="$emit('play')"
  >
    <div class="absolute inset-0">
      <!-- <PreviewImage :preview-url="version.previewUrl" /> -->
    </div>
    <div
      class="group-hover:scale-110 group-hover:shadow-xl shadow h-14 w-14 rounded-full border border-foundation bg-primary flex items-center justify-center transition -mt-10"
    >
      <PlayIcon class="h-6 w-6 ml-[3px] text-foundation" />
    </div>
    <ViewerEmbedFooter :project-url="projectUrl" project-name="title" />
  </button>
</template>

<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/20/solid'

const route = useRouter()

const projectUrl = route.currentRoute.value.path

defineEmits<{
  (e: 'play'): void
}>()
</script>
