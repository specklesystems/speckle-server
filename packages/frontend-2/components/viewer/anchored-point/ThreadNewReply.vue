<template>
  <div class="relative">
    <div class="bg-foundation rounded-full w-80 p-4 flex flex-col">
      <FormTextInput
        full-width
        name="newComment"
        class="bg-transparent focus:ring-0 focus:outline-0"
        placeholder="Press enter to send"
      />
    </div>
    <div class="absolute w-full flex justify-end pt-2 space-x-2">
      <div class="flex space-x-2">
        <FormButton :icon-left="PaperClipIcon" hide-text color="invert" />
        <FormButton :icon-left="PaperAirplaneIcon" hide-text />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/vue/24/solid'
</script>
