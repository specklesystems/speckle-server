<template>
  <OnboardingDialogBase @close="emit('close')" @cancel="emit('cancel')">
    <template #header>One step away from sending a model to Speckle!</template>
    <div class="w-full h-72 bg-primary rounded-xl flex items-center justify-center">
      <PlayIcon class="w-10 h-10 text-white" />
      <span class="text-xs">How and why to login into manager</span>
    </div>

    <div class="flex justify-center">
      <FormButton size="xl" class="shadow-md" @click="authoriseManager()">
        Authorize Manager
      </FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/24/solid'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

const emit = defineEmits(['close', 'cancel'])

const hasAuthorizedManager = useSynchronizedCookie<boolean>(`hasAuthorizedManager`)

const authoriseManager = () => {
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  a.href = `speckle://accounts?add_server_account=${window.location.origin}`
  a.click()

  hasAuthorizedManager.value = true
  emit('close')
}
</script>
