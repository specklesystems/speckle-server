<template>
  <LayoutDialog v-model:open="isOpen" max-width="xl" is-transparent>
    <div class="flex flex-col items-center justify-center gap-2">
      <NuxtImg
        :src="renderUrl"
        alt="render preview"
        class="w-full h-full max-h-[70vh] max-w-[80vw] object-contain"
      />
      <FormButton color="outline" @click="isOpen = false">Close</FormButton>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
defineProps<{
  renderUrl?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
</script>
