<template>
  <LayoutDialog :open="dialogOpen" max-width="sm" :buttons="dialogButtons">
    <h2 class="text-2xl sm:text-3xl font-bold text-center sm:-mt-4 mb-2">
      What's New in Speckle?
    </h2>
    <p class="text-foreground-2 text-center mb-6">A new way to collaborate in AEC.</p>
    <div class="aspect-video w-full">
      <iframe
        class="w-full h-full"
        src="https://www.youtube.com/embed/QI5pVV1GCNs?si=op1o9Ud4fOKsQlWe"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{ 'dialog-dismissed': [] }>()

const dialogOpen = ref(true)

const dialogButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      emit('dialog-dismissed')
    }
  },
  {
    text: 'Learn more',
    props: {
      color: 'default',
      fullWidth: true,
      outline: true,
      iconRight: ArrowTopRightOnSquareIcon,
      to: 'https://speckle.systems/blog/the-new-way-to-collaborate-in-aec/',
      external: true,
      target: '_blank'
    }
  }
])
</script>
