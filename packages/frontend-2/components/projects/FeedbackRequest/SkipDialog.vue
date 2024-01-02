<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    prevent-close-on-click-outside
    title="Feedback Option"
    hide-closer
  >
    <CommonAnimationInstructional
      :initial-position="{ top: 56, left: 71 }"
      :actions="dialogActions"
    >
      <template #background>
        <div class="flex flex-col">
          <div
            class="px-2 py-1.5 flex justify-end items-center border-b border-outline-3"
          >
            <UserCircleIcon class="h-6 w-6 opacity-70" />
          </div>
          <div class="pr-12">
            <div class="flex gap-2 items-center py-4 opacity-30">
              <div class="h-5 w-full bg-outline-3 rounded-r"></div>
              <div class="h-5 w-full bg-outline-3 rounded"></div>
              <div class="h-5 w-full bg-outline-3 rounded"></div>
            </div>
            <div
              class="border-r border-t border-b border-outline-3 h-40 mt-1 rounded-r flex gap-2 p-2 pl-0"
            >
              <div class="w-5/12 rounded-r bg-outline-3 opacity-30"></div>
              <div class="w-7/12 rounded bg-outline-3 opacity-30"></div>
            </div>
            <div
              class="border-r border-t border-b border-outline-3 h-40 mt-2 rounded-r flex gap-2 p-2 pl-0"
            >
              <div class="w-5/12 rounded-r bg-outline-3 opacity-30"></div>
              <div class="w-7/12 rounded bg-outline-3 opacity-30"></div>
            </div>
          </div>
        </div>
      </template>
      <template #slot1>
        <div
          class="absolute z-10 top-8 right-3 h-40 w-28 border border-outline-3 bg-foundation shadow-lg rounded-lg flex flex-col gap-2 p-2"
        >
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div
            class="relative h-full w-full text-xs p-1 flex gap-2 items-center justify-center"
          >
            <div class="absolute inset-0 bg-outline-3 rounded opacity-20"></div>
            <ChatBubbleLeftRightIcon class="h-4 w-4 opacity-50" />
            <span class="opacity-50">Feedback</span>
          </div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
        </div>
      </template>
      <template #slot2>
        <div
          class="absolute z-20 top-8 right-3 h-40 w-28 border border-outline-3 bg-foundation shadow-lg rounded-lg flex flex-col gap-2 p-2"
        >
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
          <div
            class="relative h-full w-full text-xs p-1 flex gap-2 items-center justify-center"
          >
            <div class="absolute inset-0 bg-outline-3 opacity-40 rounded"></div>
            <ChatBubbleLeftRightIcon class="h-4 w-4" />
            Feedback
          </div>
          <div class="h-full w-full bg-outline-3 opacity-20 rounded"></div>
        </div>
      </template>
    </CommonAnimationInstructional>
    <p>
      Want to share your thoughts later? The Feedback option is always available in your
      <strong>Profile Menu.</strong>
    </p>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CommonAnimationInstructional } from '@speckle/ui-components'
import { UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'

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

const dialogActions = computed(() => [
  { type: 'delay', duration: 1000 },
  { type: 'animation', top: 4, left: 89, duration: 1500 },
  { type: 'delay', duration: 2000 },
  { type: 'click' },
  { type: 'slot', slot: 'slot1' },
  { type: 'delay', duration: 1000 },
  { type: 'animation', top: 56, left: 71, duration: 1500 },
  { type: 'delay', duration: 800 },
  { type: 'slot', slot: 'slot1' },
  { type: 'slot', slot: 'slot2' },
  { type: 'delay', duration: 1000 },
  { type: 'click' },
  { type: 'delay', duration: 3000 },
  { type: 'slot', slot: 'slot2' }
])
</script>
