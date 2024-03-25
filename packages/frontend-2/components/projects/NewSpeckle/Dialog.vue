<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <h2 class="text-2xl sm:text-3xl font-bold text-center sm:-mt-4 mb-2">
      What's New in Speckle?
    </h2>
    <p class="text-foreground-2 text-center mb-6">A new way to collaborate in AEC.</p>
    <div class="relative bg-white">
      <div class="absolute inset-0 flex items-center justify-center" role="status">
        <svg
          aria-hidden="true"
          class="w-6 h-6 text-outline-2 animate-spin fill-primary"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span class="sr-only">Loading...</span>
      </div>
      <iframe
        title="What's new in Speckle?"
        src="https://player.vimeo.com/video/925455838?h=052c422cae&autoplay=1&title=0&loop=1&byline=0&portrait=0&controls=0&muted=1"
        frameborder="0"
        allow="autoplay; fullscreen;"
        allowfullscreen
        class="aspect-video w-full relative z-10"
      ></iframe>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

const open = defineModel<boolean>('open', { required: true })

const dialogButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      open.value = false
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
