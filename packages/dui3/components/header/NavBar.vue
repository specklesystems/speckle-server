<template>
  <nav
    v-if="!hasNoModelCards"
    class="fixed top-0 h-9 flex items-center bg-foundation border-b border-outline-2 w-full transition z-20"
  >
    <div class="flex items-center transition-all justify-between w-full">
      <div class="flex items-center space-x-2">
        <div class="max-[200px]:hidden block ml-2">
          <img
            class="block h-6 w-6"
            src="~~/assets/images/speckle_logo_big.png"
            alt="Speckle"
          />
        </div>
        <div class="relative group flex items-center">
          <FormButton
            v-tippy="'Publish objects from this file to a new Speckle model'"
            color="outline"
            size="sm"
            class="relative group px-0"
            :icon-left="ArrowUpTrayIcon"
            hide-text
            @click="showSendDialog = true"
          ></FormButton>
        </div>
        <div class="relative group flex items-center">
          <FormButton
            v-tippy="'Load a model from Speckle into this file'"
            color="outline"
            size="sm"
            class="relative group px-0"
            :icon-left="ArrowDownTrayIcon"
            hide-text
            @click="showReceiveDialog = true"
          ></FormButton>
        </div>
      </div>

      <div class="flex justify-between items-center pr-1">
        <!-- <FormButton
            v-if="!hostAppStore.isConnectorUpToDate"
            v-tippy="hostAppStore.latestAvailableVersion?.Number.replace('+0', '')"
            :icon-right="ArrowUpCircleIcon"
            size="sm"
            color="subtle"
            class="flex min-w-0 transition text-primary py-1 mr-1"
            @click.stop="hostAppStore.downloadLatestVersion()"
          >
            <span class="">Update</span>
          </FormButton> -->
        <div class="text-[8px] text-foreground-disabled max-[150px]:hidden">
          {{ hostAppStore.connectorVersion }}
        </div>
        <HeaderButton
          v-tippy="'Documentation and help'"
          @click="
            app.$openUrl(
              `https://www.speckle.systems/connectors/${hostAppStore.hostAppName}?utm=dui`
            )
          "
        >
          <QuestionMarkCircleIcon
            class="w-4 text-foreground-disabled group-hover:text-foreground-2"
          />
        </HeaderButton>
        <HeaderButton v-tippy="'Send us feedback'" @click="showFeedbackDialog = true">
          <ChatBubbleLeftIcon
            class="w-4 text-foreground-disabled group-hover:text-foreground-2"
          />
        </HeaderButton>
        <HeaderUserMenu />
      </div>
    </div>
    <FeedbackDialog v-model:open="showFeedbackDialog" />
    <SendWizard v-model:open="showSendDialog" @close="showSendDialog = false" />
    <ReceiveWizard
      v-model:open="showReceiveDialog"
      @close="showReceiveDialog = false"
    />
  </nav>
</template>
<script setup lang="ts">
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/vue/24/solid'

import { useHostAppStore } from '~/store/hostApp'
const app = useNuxtApp()
const hostAppStore = useHostAppStore()
const hasNoModelCards = computed(() => hostAppStore.projectModelGroups.length === 0)
const showFeedbackDialog = ref<boolean>(false)
const showSendDialog = ref<boolean>(false)
const showReceiveDialog = ref<boolean>(false)

app.$baseBinding.on('documentChanged', () => {
  showSendDialog.value = false
  showReceiveDialog.value = false
})
</script>
