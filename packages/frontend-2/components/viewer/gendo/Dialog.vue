<template>
  <LayoutDialog v-model:open="isOpen" max-width="xl" is-transparent hide-closer>
    <div class="relative flex flex-col items-center justify-center gap-2 w-full h-full">
      <!-- Fullscreen button behind image to handle background clicks -->
      <!-- that are still inside dialog and show loading state -->
      <button
        class="absolute inset-0 flex items-center justify-center"
        @click="isOpen = false"
      >
        <CommonLoadingIcon />
      </button>
      <div class="flex items-center justify-center w-full h-full min-h-96">
        <NuxtImg
          :src="renderUrl"
          :alt="renderPrompt"
          class="relative z-10 w-full h-full max-h-[70vh] max-w-[80vw] object-contain rounded-xl"
        />
      </div>
      <div
        v-if="!hasFeedback"
        class="bg-foundation rounded-md p-2 relative z-10 flex items-center justify-between gap-2 mb-4 w-full"
      >
        <div class="flex gap-2 h-8">
          <FormButton :to="renderUrl" external target="_blank" download color="outline">
            Download
          </FormButton>
          <FormButton color="subtle" @click="isOpen = false">Close</FormButton>
        </div>
        <div class="flex items-center gap-2">
          <p class="text-body-xs text-foreground-2">
            What do you think about this render?
          </p>
          <FormButton
            :icon-left="HandThumbUpIcon"
            hide-text
            color="subtle"
            @click="handleThumbsUp"
          >
            Thumbs up
          </FormButton>
          <FormButton
            :icon-left="HandThumbDownIcon"
            hide-text
            color="subtle"
            @click="handleThumbsDown"
          >
            Thumbs down
          </FormButton>
        </div>
      </div>
      <div v-else class="flex items-center gap-2">
        <p class="text-body-xs text-foreground-2">Thanks for your feedback!</p>
        <FormButton color="outline" @click="isFeedbackDialogOpen = true">
          Give detailed feedback
        </FormButton>
      </div>
    </div>
    <FeedbackDialog
      v-model:open="isFeedbackDialogOpen"
      type="gendo"
      intro="Help us improve Gendo AI renders. Share your thoughts about the quality, prompts that work well, or features you'd like to see."
      :metadata="{
        initialFeedback: initialFeedback,
        render_url: renderUrl,
        prompt: renderPrompt
      }"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/vue/24/solid'
import { useMixpanel } from '~/lib/core/composables/mp'

const mixpanel = useMixpanel()

const props = defineProps<{
  renderUrl?: string
  renderPrompt?: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const isFeedbackDialogOpen = ref(false)
const hasFeedback = ref(false)
const initialFeedback = ref<'positive' | 'negative' | null>(null)

const handleThumbsUp = () => {
  initialFeedback.value = 'positive'
  mixpanel.track('Gendo Render Feedback', {
    feedback: 'positive',
    prompt: props.renderPrompt,
    // eslint-disable-next-line camelcase
    render_url: props.renderUrl
  })
  hasFeedback.value = true
}

const handleThumbsDown = () => {
  initialFeedback.value = 'negative'
  mixpanel.track('Gendo Render Feedback', {
    feedback: 'negative',
    prompt: props.renderPrompt,
    // eslint-disable-next-line camelcase
    render_url: props.renderUrl
  })
  hasFeedback.value = true
}
</script>
