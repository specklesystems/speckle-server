<template>
  <div>
    <div
      class="flex flex-col gap-3 justify-between sm:items-center sm:flex-row px-4 pt-3 pb-4 sm:py-2 transition hover:bg-primary-muted"
    >
      <div class="flex gap-2 items-center">
        <div class="h-8 w-8 flex items-center justify-center">
          <SparklesIcon class="h-5 w-5 text-primary" />
        </div>
        <div class="text-foreground text-sm">Announcing the New Speckle Web App</div>
      </div>
      <div class="flex gap-3">
        <FormButton size="sm" color="default" text @click="emitDismissedOrOpened">
          Skip
        </FormButton>
        <FormButton size="sm" class="px-4" to="/" @click="showDialog = true">
          See What's New
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

const emit = defineEmits<{ 'new-speckle-dismissed-or-opened': [] }>()

const emitDismissedOrOpened = () => {
  showDialog.value = false
  emit('new-speckle-dismissed-or-opened')
}

const showDialog = ref(false)
</script>
