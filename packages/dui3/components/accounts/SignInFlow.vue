<template>
  <div>
    <div v-show="!isAddingAccount" class="text-foreground-2 my-2 space-y-2">
      <div v-if="showCustomServerInput">
        <FormTextInput
          v-model="customServerUrl"
          name="name"
          :show-label="false"
          placeholder="app.speckle.systems"
          color="foundation"
          autocomplete="off"
        />
      </div>
      <FormButton full-width @click="startAccountAddFlow()">Sign In</FormButton>
      <FormButton text size="sm" full-width @click="showCustomServerInput = true">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAccountStore } from '~~/store/accounts'

const accountStore = useAccountStore()

const app = useNuxtApp()

const customServerUrl = ref<string | undefined>(undefined)
const isAddingAccount = ref(false)
const showHelp = ref(false)
const showCustomServerInput = ref(false)

const accountCheckerIntervalFn = useIntervalFn(
  async () => {
    const previousAccountCount = accountStore.accounts.length
    await accountStore.refreshAccounts()
    const currentAccountCount = accountStore.accounts.length
    if (previousAccountCount !== currentAccountCount) {
      isAddingAccount.value = false
      showCustomServerInput.value = false
      accountCheckerIntervalFn.pause()
    }
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
  const url = customServerUrl.value
    ? `http://localhost:29364/auth/add-account?serverUrl=${customServerUrl.value}`
    : `http://localhost:29364/auth/add-account`

  app.$openUrl(url)
}

const restartFlow = () => {
  isAddingAccount.value = false
  showHelp.value = false
}
</script>
