<template>
  <div>
    <div
      class="flex flex-col space-y-4 sm:space-y-0 sm:space-x-2 sm:items-center sm:flex-row px-4 py-5 sm:py-2 transition hover:bg-primary-muted"
    >
      <div class="flex space-x-2 items-center grow text-sm">
        <div class="text-foreground">
          How are we doing? Share your feedback in our survey!
        </div>
      </div>
      <div class="flex space-x-2 w-full sm:w-auto shrink-0">
        <FormButton size="sm" color="default" text @click="showSkipDialog = true">
          Skip
        </FormButton>
        <FormButton
          size="sm"
          class="px-4"
          :icon-right="ArrowTopRightOnSquareIcon"
          to="https://forms.gle/ngyffiVaZKzEKmtr7"
          external
          target="_blank"
          @click="emitDismissedOrOpened"
        >
          Open Survey
        </FormButton>
      </div>
    </div>
    <ProjectsFeedbackRequestSkipDialog
      :open="showSkipDialog"
      @skip-dialog-dismissed="emitDismissedOrOpened"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid'

const emit = defineEmits<{ 'feedback-dismissed-or-opened': [] }>()

const emitDismissedOrOpened = () => {
  showSkipDialog.value = false
  emit('feedback-dismissed-or-opened')
}

const showSkipDialog = ref(false)
</script>
