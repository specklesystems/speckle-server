<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="renderPrompt"
    max-width="xl"
    is-transparent
  >
    <div class="flex flex-col gap-4">
      <NuxtImg
        :src="renderUrl"
        alt="render preview"
        class="w-full h-full max-h-[80vh] max-w-[80vw] object-contain"
      />
      <FormButton color="outline" @click="isOpen = false">Close</FormButton>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
defineProps<{
  renderUrl: string
  renderPrompt: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })
</script>
