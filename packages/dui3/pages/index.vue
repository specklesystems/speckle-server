<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="px-[2px]">
    <!-- TODO: Change below buttons page to somewhere else once we have proper pages for send and receive -->
    <div class="space-x-2 mb-6 p-1 flex mt-2">
      <FormButton
        :icon-left="CloudArrowUpIcon"
        size="sm"
        class="flex-1"
        @click="showSendDialog = !showSendDialog"
      >
        Send
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
          <SendWizard />
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
import { useHostAppStore } from '~~/store/hostApp'
import { useConfigStore } from '~/store/config'
const store = useHostAppStore()
const configStore = useConfigStore()
const router = useRouter()

const showSendDialog = ref(false)

// NOTE: Watching configStore initialization is important since sometimes it init after mount
watch(
  () => configStore.isInitialized,
  (newVal) => {
    if (newVal) {
      // Now the store is initialized, check for onboarding status
      if (!configStore.onboardingCompleted && !configStore.onboardingSkipped) {
        router.push('/onboardingIndex')
      }
    }
  }
)

onMounted(() => {
  // We route this page after onboarding steps completed, so it's better to check again all completed or not.
  if (!configStore.onboardingCompleted && !configStore.onboardingSkipped) {
    router.push('/onboardingIndex')
  }
})
</script>
