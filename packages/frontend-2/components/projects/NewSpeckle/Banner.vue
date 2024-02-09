<template>
  <div>
    <div
      class="flex flex-col gap-4 justify-between sm:items-center sm:flex-row px-4 py-5 sm:py-2 transition hover:bg-primary-muted"
    >
      <div class="flex gap-3 items-center">
        <div class="bg-primary rounded h-8 w-8 flex items-center justify-center">
          <SpeakerWaveIcon class="h-5 w-5 text-white" />
        </div>
        <div class="text-foreground text-sm">New Speckle Experience</div>
      </div>
      <div class="flex gap-2">
        <FormButton size="sm" color="default" text @click="emitDismissedOrOpened">
          Skip
        </FormButton>
        <FormButton
          size="sm"
          class="px-4"
          :icon-right="SparklesIcon"
          to="/"
          @click="showDialog = true"
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
import { SpeakerWaveIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{ 'new-speckle-dismissed-or-opened': [] }>()

const emitDismissedOrOpened = () => {
  showDialog.value = false
  emit('new-speckle-dismissed-or-opened')
}

const showDialog = ref(false)
</script>
