<template>
  <div>
    <div
      class="flex flex-col gap-3 justify-between sm:items-center sm:flex-row px-4 pt-3 pb-4 sm:py-2 transition hover:bg-primary-muted"
    >
      <div class="flex gap-2 items-center">
        <div class="h-8 w-8 flex items-center justify-center">
          <SparklesIcon class="h-5 w-5 text-primary" />
        </div>
        <div class="text-foreground text-sm">Announcing the new Speckle web app</div>
      </div>
      <div class="flex gap-3">
        <FormButton color="primary" text @click="emit('dismissed')">Skip</FormButton>
        <FormButton class="px-4" to="/" @click="showDialog = true">
          See What's New
        </FormButton>
      </div>
    </div>
    <ProjectsNewSpeckleDialog v-model:open="showDialog" />
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon } from '@heroicons/vue/24/solid'

const emit = defineEmits<{ dismissed: [] }>()

const showDialog = ref(false)

watch(showDialog, (newValue, oldValue) => {
  if (!newValue && oldValue) {
    showDialog.value = false
    emit('dismissed')
  }
})
</script>
