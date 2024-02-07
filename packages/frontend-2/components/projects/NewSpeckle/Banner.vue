<template>
  <div>
    <div
      class="flex flex-col space-y-4 sm:space-y-0 sm:space-x-2 sm:items-center sm:flex-row px-4 py-5 sm:py-2 transition hover:bg-primary-muted"
    >
      <div class="flex space-x-2 items-center grow text-sm">
        <div class="text-foreground">New Speckle Experience</div>
      </div>
      <div class="flex space-x-2 w-full sm:w-auto shrink-0">
        <FormButton size="sm" color="default" text @click="showDialog = true">
          Skip
        </FormButton>
        <FormButton
          size="sm"
          class="px-4"
          :icon-right="SparklesIcon"
          to="/"
          @click="emitDismissedOrOpened"
        >
          Show me
        </FormButton>
      </div>
    </div>
    <ProjectsNewSpeckleDialog
      v-model:open="showDialog"
      @dialog-dismissed="emitDismissedOrOpened"
    />
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon } from '@heroicons/vue/24/solid'

const emit = defineEmits<{ 'feedback-dismissed-or-opened': [] }>()

const emitDismissedOrOpened = () => {
  showDialog.value = false
  emit('feedback-dismissed-or-opened')
}

const showDialog = ref(false)
</script>
