<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <div
      v-if="hasNoModelCards"
      class="fixed top-0 h-screen w-screen flex items-center pointer-events-none"
    >
      <LayoutPanel
        fancy-glow
        class="mr-4 ml-2 scale-95 hover:scale-100 transition pointer-events-auto"
      >
        <h1
          class="h4 font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
        >
          Hello!
        </h1>
        <div class="text-foreground-2">
          There are no Speckle models being published or loaded in this file yet.
        </div>
        <div class="grid grid-cols-2 max-[275px]:grid-cols-1 gap-2 mt-4">
          <div>
            <FormButton
              :icon-left="CloudArrowUpIcon"
              full-width
              @click="showSendDialog = !showSendDialog"
            >
              Publish
            </FormButton>
          </div>
          <div>
            <FormButton
              :icon-left="CloudArrowDownIcon"
              full-width
              @click="showReceiveDialog = !showReceiveDialog"
            >
              Load
            </FormButton>
          </div>
        </div>
      </LayoutPanel>
    </div>
    <div class="space-y-4 mt-4 max-w-2/3">
      <div v-for="project in store.projectModelGroups" :key="project.projectId">
        <CommonProjectModelGroup :project="project" />
      </div>
    </div>
    <div
      v-if="!hasNoModelCards"
      class="fixed bottom-0 left-0 w-full bg-blue-500/50 rounded-t-md p-2 z-100 grid grid-cols-2 max-[275px]:grid-cols-1 gap-2"
    >
      <div>
        <FormButton
          :icon-left="CloudArrowUpIcon"
          full-width
          @click="showSendDialog = !showSendDialog"
        >
          Publish
        </FormButton>
      </div>
      <div>
        <FormButton
          :icon-left="CloudArrowDownIcon"
          full-width
          @click="showReceiveDialog = !showReceiveDialog"
        >
          Load
        </FormButton>
      </div>
    </div>
    <LayoutDialog v-model:open="showSendDialog" hide-closer>
      <div class="-mx-4 -my-4 pt-4">
        <SendWizard @close="showSendDialog = false" />
      </div>
    </LayoutDialog>
    <LayoutDialog v-model:open="showReceiveDialog" hide-closer>
      <div class="-mx-4 -my-4 pt-4">
        <ReceiveWizard @close="showReceiveDialog = false" />
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowDownIcon, CloudArrowUpIcon } from '@heroicons/vue/24/solid'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'

// IMPORTANT: the account store needs to be awaited here, and in any other top level page to prevent
// race conditions on initialisation (model cards get loaded, but accounts are not there yet)
// TODO: guard against this later, incase we will have more top level entry pages
const accountStore = useAccountStore()
await accountStore.refreshAccounts()

const store = useHostAppStore()

const showSendDialog = ref(false)
const showReceiveDialog = ref(false)

const hasNoModelCards = computed(() => store.projectModelGroups.length === 0)
</script>
