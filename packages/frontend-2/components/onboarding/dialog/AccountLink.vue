<template>
  <OnboardingDialogBase v-model:open="openState">
    <template #header>Log In 🔑</template>
    <div
      class="w-full h-[351px] bg-primary rounded-xl flex items-center justify-center overflow-hidden"
    >
      <iframe
        width="560"
        height="315"
        src="https://www.youtube-nocookie.com/embed/enJk9lslnvs?rel=0&autoplay=1"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        class="w-full h-full"
      ></iframe>
    </div>

    <div class="flex justify-center">
      <FormButton size="xl" class="shadow-md" @click="authoriseManager()">
        Authorize Manager
      </FormButton>
    </div>
  </OnboardingDialogBase>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

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
