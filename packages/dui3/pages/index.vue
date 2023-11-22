<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="p-2 mt-2 space-y-4">
    <!-- TODO: Change below buttons page to somewhere else once we have proper pages for send and receive -->
    <div class="space-x-2 mb-6 p-1 flex">
      <FormButton
        :icon-left="CloudArrowUpIcon"
        size="sm"
        to="/onboarding/send"
        class="flex-1"
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
