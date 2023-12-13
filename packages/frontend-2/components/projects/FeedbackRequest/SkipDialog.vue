<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
    title="Feedback Option"
    hide-closer
  >
    <div
      class="relative aspect-square w-full h-full max-w-xs mx-auto mb-8 flex flex-col divide-y border overflow-hidden"
    >
      <CursorArrowRaysIcon class="absolute right-16 bottom-24 z-10 h-8 w-10" />
      <div class="p-2 flex justify-end items-center">
        <UserCircleIcon class="h-6 w-6" />
      </div>
      <div class="pr-12">
        <div class="flex gap-2 items-center py-4">
          <div class="h-6 w-full bg-primary-muted rounded-r"></div>
          <div class="h-6 w-full bg-primary-muted rounded"></div>
          <div class="h-6 w-full bg-primary-muted rounded"></div>
        </div>
        <div class="border-r border-t border-b h-32 mt-2 rounded flex gap-2 p-2 pl-0">
          <div class="w-5/12 rounded-r bg-primary-muted"></div>
          <div class="w-7/12 rounded bg-primary-muted"></div>
        </div>
        <div class="border-r border-t border-b h-32 mt-2 rounded flex gap-2 p-2 pl-0">
          <div class="w-5/12 rounded-r bg-primary-muted"></div>
          <div class="w-7/12 rounded bg-primary-muted"></div>
        </div>
      </div>
    </div>
    <p>
      Want to share your thoughts later? The Feedback option is always available in your
      <strong>Profile Menu.</strong>
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { UserCircleIcon, CursorArrowRaysIcon } from '@heroicons/vue/24/outline'

const isOpen = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ 'skip-dialog-dismissed': [] }>()

const dialogButtons = computed(() => [
  {
    text: 'OK',
    props: { color: 'default', fullWidth: true, outline: true },
    onClick: () => {
      emit('skip-dialog-dismissed')
    }
  }
])
</script>
