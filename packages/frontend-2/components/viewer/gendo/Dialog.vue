<template>
  <LayoutDialog v-model:open="isOpen" max-width="xl" is-transparent>
    <div class="relative flex flex-col items-center justify-center gap-2 w-full h-full">
      <!-- Fullscreen button behind image to handle background clicks -->
      <!-- that are still inside dialog and show loading state -->
      <button
        class="absolute inset-0 flex items-center justify-center"
        @click="isOpen = false"
      >
        <CommonLoadingIcon />
      </button>
      <NuxtImg
        :src="renderUrl"
        :alt="renderPrompt"
        class="relative z-10 w-full h-full max-h-[70vh] max-w-[80vw] object-contain"
      />
      <FormButton
        class="relative z-10"
        color="outline"
        :icon-left="XMarkIcon"
        @click="isOpen = false"
      >
        Close
      </FormButton>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'

defineProps<{
  renderUrl?: string
  renderPrompt?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
</script>
