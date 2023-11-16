<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="p-2 mt-2 space-y-4">
    <!-- This is the place I want to navigate (route) to onboarding page if (configStore.onboardingCompleted) -->
    <div v-for="project in store.projectModelGroups" :key="project.projectId">
      <CommonProjectModelGroup :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
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
