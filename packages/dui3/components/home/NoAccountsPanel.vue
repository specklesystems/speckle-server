<template>
  <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
    <h1
      class="h4 w-full bg-red-400 text-center font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
    >
      Welcome to Speckle
    </h1>

    <div v-show="!isAddingAccount" class="text-foreground-2 my-2 space-y-2">
      <FormButton size="lg" full-width @click="startAccountAddFlow()">
        Sign In
      </FormButton>
      <FormButton text size="sm" full-width @click="startAccountAddFlow()">
        Sign in to custom server
      </FormButton>
    </div>
    <div v-show="isAddingAccount" class="text-foreground-2 mt-2 mb-4 space-y-2">
      <div class="text-sm text-center">
        Please check your browser: waiting for authorization to complete.
      </div>
      <div class="py-2"><CommonLoadingBar :loading="isAddingAccount" /></div>
      <div v-if="showHelp" class="bg-blue-500/10 p-2 rounded-md space-y-2">
        <div class="text-sm text-center">Having trouble?</div>
        <FormButton size="sm" full-width @click="restartFlow()">Retry</FormButton>
        <FormButton
          text
          size="sm"
          full-width
          @click="$openUrl('https://speckle.community')"
        >
          Get in touch with us
        </FormButton>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { useAccountStore } from '~~/store/accounts'
// import { useHostAppStore } from '~~/store/hostApp'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const app = useNuxtApp()

const accountStore = useAccountStore()

const { trackEvent } = useMixpanel()

const isAddingAccount = ref(false)
const showHelp = ref(false)

const accountCheckerIntervalFn = useIntervalFn(
  async () => {
    await accountStore.refreshAccounts()
  },
  1000,
  { immediate: false }
)

const startAccountAddFlow = () => {
  isAddingAccount.value = true
  accountCheckerIntervalFn.resume()
  setTimeout(() => {
    showHelp.value = true
  }, 10_000)
  app.$openUrl(`http://localhost:29363/auth/add-account`)
}

const restartFlow = () => {
  isAddingAccount.value = false
  showHelp.value = false
}
</script>
