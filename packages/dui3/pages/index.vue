<template>
  <div>
    <div v-if="store.hostAppName">
      <div v-if="!config.isDevMode" class="px-1">
        <CommonUpdateAlert />
      </div>
      <!-- IMPORTANT CHECK!! otherwise host app communication corrputed for many different reasons -->
      <div v-if="accounts.length != 0">
        <div
          v-if="hasNoModelCards"
          class="fixed h-screen w-screen flex items-center justify-center pr-2 pointer-events-none"
        >
          <LayoutPanel fancy-glow class="transition pointer-events-auto w-[90%]">
            <h1
              class="text-heading-lg w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
            >
              Hello!
            </h1>
            <!-- Returning null from host app is blocked by CI for now, hence host app send here empty documentInfo, we check it's id whether null or not. -->
            <div v-if="!!store.documentInfo?.id">
              <div class="text-foreground-2 text-body-sm">
                There are no Speckle models being published or loaded in this file yet.
              </div>
              <div
                class="flex space-x-2 max-[275px]:flex-col max-[275px]:space-y-2 max-[275px]:space-x-0 mt-4"
              >
                <div v-if="app.$sendBinding" class="grow">
                  <FormButton
                    v-tippy="'Publish objects from this file to a new model'"
                    :icon-left="ArrowUpTrayIcon"
                    color="outline"
                    full-width
                    @click="handleSendClick"
                  >
                    Publish
                  </FormButton>
                </div>
                <div v-if="app.$receiveBinding" class="grow">
                  <FormButton
                    v-tippy="'Load an existing model in this file'"
                    :icon-left="ArrowDownTrayIcon"
                    color="outline"
                    full-width
                    @click="handleReceiveClick"
                  >
                    Load
                  </FormButton>
                </div>
              </div>
            </div>
            <div v-else>
              <div v-if="store.documentInfo?.message" class="text-foreground-2">
                {{ store.documentInfo?.message }}
              </div>
              <div v-else class="text-foreground-2">
                Welcome to Speckle! Please open a file to use this plugin.
              </div>
            </div>
            <!-- TEMPORARY MESSAGE TO USER! will be deleted -->
            <div class="mt-2 bg-highlight-1 rounded-md p-2">
              <h1
                class="text-heading-sm w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
              >
                Speckle for
                <span class="capitalize">{{ store.hostAppName }}</span>
              </h1>
              <div class="text-foreground-2 text-body-xs">
                Get started in no time with our key workflows and tutorials for
                <span class="capitalize">{{ store.hostAppName }}:</span>
                <FormButton
                  size="sm"
                  color="outline"
                  class="my-2"
                  full-width
                  @click="
                    app.$openUrl(
                      `https://speckle.systems/connectors/${store.hostAppName}`
                    )
                  "
                >
                  <span class="capitalize">{{ store.hostAppName }}&nbsp;</span>
                  documentation
                </FormButton>
              </div>

              <FormButton
                text
                size="sm"
                color="subtle"
                class=""
                full-width
                @click="
                  app.$openUrl(
                    'https://speckle.community/t/next-gen-connectors-supported-workflows-and-faq/16162'
                  )
                "
              >
                <span class="text-foreground-2 text-body-3xs truncate line-clamp-1">
                  New connectors announcement
                </span>
              </FormButton>
            </div>
          </LayoutPanel>
        </div>
        <div v-if="accounts.length !== 0 && !hasNoModelCards" class="space-y-2">
          <div v-for="project in store.projectModelGroups" :key="project.projectId">
            <CommonProjectModelGroup :project="project" />
          </div>
        </div>
        <!-- Triggered by "Show Details" button on Toast Notification -->
        <ErrorDialog
          v-model:open="store.showErrorDialog"
          chromium65-compatibility
          @close="store.showErrorDialog = false"
        />
      </div>
      <!-- No accounts present: display a signin button. This currently launches manager. -->
      <!-- NOTE: The flow is horrible, we should migrate as many connectors as possible to their own account adding logic -->
      <div v-else>
        <div
          class="fixed h-screen w-screen flex items-center justify-center pr-2 pointer-events-none"
        >
          <HomeNoAccountsPanel />
        </div>
      </div>
    </div>
    <div v-else>
      <div class="fixed h-screen w-screen flex items-center pointer-events-none">
        <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
          <h1
            class="h4 font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
          >
            Reload needed!
          </h1>
          <div class="text-foreground-2 mt-2 mb-4">
            Host application lost its communication with user interface for some reason.
          </div>
          <FormButton :icon-left="ArrowPathIcon" full-width @click="reload()">
            Reload
          </FormButton>
        </LayoutPanel>
      </div>
    </div>
    <SendWizard v-model:open="showSendDialog" @close="showSendDialog = false" />
    <ReceiveWizard
      v-model:open="showReceiveDialog"
      @close="showReceiveDialog = false"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/solid'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'
import { useConfigStore } from '~~/store/config'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
const app = useNuxtApp()
const config = useConfigStore()

// IMPORTANT: the account store needs to be awaited here, and in any other top level page to prevent
// race conditions on initialisation (model cards get loaded, but accounts are not there yet)
// TODO: guard against this later, incase we will have more top level entry pages
const accountStore = useAccountStore()
await accountStore.refreshAccounts()

const { accounts } = storeToRefs(accountStore)

const store = useHostAppStore()
const { trackEvent } = useMixpanel()

const showSendDialog = ref(false)
const showReceiveDialog = ref(false)

app.$baseBinding.on('documentChanged', () => {
  showSendDialog.value = false
  showReceiveDialog.value = false
})

const handleSendClick = () => {
  showSendDialog.value = !showSendDialog.value
  trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'start' })
}

const handleReceiveClick = () => {
  showReceiveDialog.value = !showReceiveDialog.value
  trackEvent('DUI3 Action', { name: 'Load Wizard', step: 'start' })
}

const hasNoModelCards = computed(
  () => store.projectModelGroups.length === 0 || hasNoValidProjects.value
)
const hasNoValidProjects = computed(() => {
  const serverUrls = accounts.value
    .filter((acc) => acc.isValid)
    .map((acc) => acc.accountInfo.serverInfo.url)

  return (
    store.projectModelGroups.filter((p) => serverUrls.includes(p.serverUrl)).length ===
    0
  )
})

const reload = () => {
  window.location.reload()
}
</script>
