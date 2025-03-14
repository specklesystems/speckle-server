<template>
  <div>
    <div v-if="store.hostAppName">
      <!-- IMPORTANT CHECK!! otherwise host app communication corrputed for many different reasons -->
      <div v-if="accounts.length != 0">
        <div
          v-if="hasNoModelCards"
          class="fixed h-screen w-screen flex items-center justify-center pr-2 pointer-events-none"
        >
          <LayoutPanel fancy-glow class="transition pointer-events-auto w-[90%]">
            <h1
              class="h4 font-bold w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
            >
              Hello!
            </h1>
            <!-- Returning null from host app is blocked by CI for now, hence host app send here empty documentInfo, we check it's id whether null or not. -->
            <div v-if="!!store.documentInfo?.id">
              <div class="text-foreground-2">
                There are no Speckle models being published or loaded in this file yet.
              </div>
              <div
                class="flex space-x-2 max-[275px]:flex-col max-[275px]:space-y-2 max-[275px]:space-x-0 mt-4"
              >
                <div v-if="app.$sendBinding" class="grow">
                  <FormButton
                    :icon-left="ArrowUpCircleIcon"
                    full-width
                    @click="handleSendClick"
                  >
                    Publish
                  </FormButton>
                </div>
                <div v-if="app.$receiveBinding" class="grow">
                  <FormButton
                    :icon-left="ArrowDownCircleIcon"
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
            <div class="mt-2 bg-blue-500/10 rounded-md p-2">
              <h1
                class="h4 font-bold w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
              >
                Note: Beta Connector
              </h1>
              <div class="text-foreground-2 text-sm">
                This is a
                <span class="font-bold">beta</span>
                connector that will eventually replace the existing one.
                <br />
                <br />
                While in beta, there will be some missing functionality and some rough
                corners.
              </div>
              <!-- TODO: replace with correct link -->
              <FormButton
                text
                link
                @click="
                  app.$openUrl(
                    'https://speckle.community/t/next-gen-connectors-supported-workflows-and-faq/16162'
                  )
                "
              >
                Find out more
              </FormButton>
            </div>
          </LayoutPanel>
        </div>
        <div
          v-if="accounts.length !== 0 && !hasNoModelCards"
          class="space-y-2 mt-2 max-w-2/3 mb-16"
        >
          <div v-for="project in store.projectModelGroups" :key="project.projectId">
            <CommonProjectModelGroup :project="project" />
          </div>
        </div>
        <div
          v-if="!hasNoModelCards"
          class="z-20 fixed bottom-0 left-0 w-full bg-blue-500/50 rounded-t-md p-2 z-100 flex space-x-2 max-[275px]:flex-col max-[275px]:space-y-2 max-[275px]:space-x-0"
        >
          <div v-if="app.$sendBinding" class="grow">
            <FormButton
              :icon-left="ArrowUpCircleIcon"
              full-width
              @click="handleSendClick"
            >
              Publish
            </FormButton>
          </div>
          <div v-if="app.$receiveBinding" class="grow">
            <FormButton
              :icon-left="ArrowDownCircleIcon"
              full-width
              @click="handleReceiveClick"
            >
              Load
            </FormButton>
          </div>
        </div>

        <SendWizard v-model:open="showSendDialog" @close="showSendDialog = false" />
        <ReceiveWizard
          v-model:open="showReceiveDialog"
          @close="showReceiveDialog = false"
        />
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
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/solid'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
const app = useNuxtApp()
// IMPORTANT: the account store needs to be awaited here, and in any other top level page to prevent
// race conditions on initialisation (model cards get loaded, but accounts are not there yet)
// TODO: guard against this later, incase we will have more top level entry pages
const accountStore = useAccountStore()
await accountStore.refreshAccounts()

const { accounts, isLoading } = storeToRefs(accountStore)

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

const hasNoModelCards = computed(() => store.projectModelGroups.length === 0)

const reload = () => {
  window.location.reload()
}
</script>
