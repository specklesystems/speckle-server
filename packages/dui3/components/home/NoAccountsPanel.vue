<template>
  <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
    <h1
      class="h4 w-full bg-red-400 text-center font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
    >
      Welcome to Speckle
    </h1>
    <div v-if="isDesktopServiceAvailable">
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
      <LayoutDialog
        v-model:open="showCustomServerDialog"
        title="Custom server"
        fullscreen="none"
      >
        bla
      </LayoutDialog>
    </div>
    <div v-else>
      <div class="text-foreground-2 mt-2 mb-4">
        Click the button below to sign into Speckle via Manager. This will allow you to
        publish or load data.
      </div>
      <div class="text-foreground-2 text-sm mt-2 mb-4"></div>
      <div class="flex flex-wrap justify-center space-y-2 max-width">
        <FormButton full-width @click="$openUrl(`speckle://accounts`)">
          Sign In
        </FormButton>
        <div>
          <div class="text-xs">Already done?</div>
          <FormButton
            size="sm"
            full-width
            text
            link
            @click="accountStore.refreshAccounts()"
          >
            Click to refresh
          </FormButton>
        </div>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { useAccountStore } from '~~/store/accounts'
// import { useHostAppStore } from '~~/store/hostApp'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useDesktopService } from '~/lib/core/composables/desktopService'

const app = useNuxtApp()
const accountStore = useAccountStore()

const { trackEvent } = useMixpanel()
const { pingDesktopService } = useDesktopService()

const customServerUrl = ref<string | undefined>(undefined)
const isDesktopServiceAvailable = ref(false) // this should be false default because there is a delay if /ping is not successful.
const isAddingAccount = ref(false)
const showHelp = ref(false)
const showCustomServerDialog = ref(false)
const showCustomServerInput = ref(false)

const accountCheckerIntervalFn = useIntervalFn(
  async () => {
    await accountStore.refreshAccounts()
  },
  1000,
  { immediate: false }
)

const startAccountAddFlow = (serverUrl: string | undefined = undefined) => {
  isAddingAccount.value = true
  accountCheckerIntervalFn.resume()
  setTimeout(() => {
    showHelp.value = true
  }, 10_000)
  if (customServerUrl.value) {
    app.$openUrl(
      `http://localhost:29363/auth/add-account?serverUrl=${customServerUrl.value}`
    )
  } else {
    app.$openUrl(`http://localhost:29363/auth/add-account`)
  }
}

const restartFlow = () => {
  isAddingAccount.value = false
  showHelp.value = false
}

onMounted(async () => {
  isDesktopServiceAvailable.value = await pingDesktopService()
  console.log(isDesktopServiceAvailable.value)
})
</script>
