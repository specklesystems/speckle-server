<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div>
    <div
      class="fixed bottom-0 left-0 w-full bg-primary rounded-t-xl space-x-2 p-1 flex z-100"
    >
      <FormButton
        :icon-left="CloudArrowUpIcon"
        size="sm"
        class="flex-1"
        @click="showSendDialog = !showSendDialog"
      >
        Publish
      </FormButton>
      <FormButton
        :icon-left="CloudArrowDownIcon"
        size="sm"
        to="/onboarding/receive"
        class="flex-1"
      >
        Receive
      </FormButton>
      <LayoutDialog v-model:open="showSendDialog" hide-closer>
        <div class="-mx-4 -my-4 pt-4">
          <SendWizard @close="showSendDialog = false" />
        </div>
      </LayoutDialog>
    </div>
    <!-- This is the place I want to navigate (route) to onboarding page if (configStore.onboardingCompleted) -->
    <div v-for="project in store.projectModelGroups" :key="project.projectId">
      <CommonProjectModelGroup :project="project" />
    </div>
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
</script>
