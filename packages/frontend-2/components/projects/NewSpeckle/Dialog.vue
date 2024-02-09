<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <h2 class="text-3xl font-bold text-center -mt-4 mb-2">What's new in Speckle?</h2>
    <p class="text-foreground-2 text-center mb-6">A new way to collaborate in AEC.</p>
    <div class="aspect-video w-full">
      <div class="bg-gray-200 w-full h-full"></div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ 'dialog-dismissed': [] }>()

const dialogButtons = computed(() => [
  {
    text: 'Close',
    props: { color: 'invert', fullWidth: true, outline: true },
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
      to: 'https://speckle.systems/blog/',
      external: true,
      target: '_blank'
    },
    onClick: () => {
      emit('dialog-dismissed')
    }
  }
])
</script>
