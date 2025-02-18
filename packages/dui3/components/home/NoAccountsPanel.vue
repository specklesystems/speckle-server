<template>
  <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
    <h1
      class="h4 w-full bg-red-400 text-center font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
    >
      Welcome to Speckle
    </h1>
    <div v-if="isDesktopServiceAvailable">
      <AccountsSignInFlow />
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
import { useAccountStore } from '~~/store/accounts'
import { useDesktopService } from '~/lib/core/composables/desktopService'

const accountStore = useAccountStore()
const { pingDesktopService } = useDesktopService()

const isDesktopServiceAvailable = ref(false) // this should be false default because there is a delay if /ping is not successful.

onMounted(async () => {
  isDesktopServiceAvailable.value = await pingDesktopService()
})
</script>
