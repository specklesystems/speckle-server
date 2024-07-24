<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Your first model upload ⬆️</template>
    <CommonVimeoEmbed
      vimeo-id="925894349"
      title="Onboarding: First Model Upload"
      autoplay
      controls
    />
    <div class="flex justify-center my-1">
      <FormButton size="lg" class="shadow-md" @click="emit('done')">Got it!</FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CubeIcon } from '@heroicons/vue/24/solid'
import { CommonVimeoEmbed } from '@speckle/ui-components'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'done'): void
}>()

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
