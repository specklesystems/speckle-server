<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Log in 🔑</template>
    <CommonVimeoEmbed
      vimeo-id="925894038"
      title="Onboarding: Log in to your Speckle account"
      autoplay
      controls
    />
    <div class="flex justify-center mt-2">
      <FormButton size="lg" class="shadow-md" @click="authoriseManager()">
        Authorize manager
      </FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
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

const hasAuthorizedManager = useSynchronizedCookie<boolean>(`hasAuthorizedManager`)

const authoriseManager = () => {
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  a.href = `speckle://accounts?add_server_account=${window.location.origin}`
  a.click()

  hasAuthorizedManager.value = true
  emit('done')
}
</script>
