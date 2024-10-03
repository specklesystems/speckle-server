<template>
  <div class="mt-1 mb-1">
    <ViewerLayoutPane @close="$emit('close')">
      <div v-if="isEmpty">
        <ViewerDataInsightsEmpty
          :function-id="functionId"
          :function-release-id="functionReleaseId"
          @run-triggered="runTriggered"
        />
      </div>
      <div v-else-if="isAutomationRunning">
        Foo
        <!-- <DotlottiePlayer
          src="https://lottie.host/ffc5ea7d-8c2e-49aa-b84d-9b336ca7b963/ZPSkZUvsE7.json"
          background="transparent"
          speed="1"
          style="width: 300px; height: 300px"
          loop
          autoplay
        ></DotlottiePlayer> -->
      </div>
      <div v-else>
        <ViewerDataInsightsGraph />
      </div>
    </ViewerLayoutPane>
  </div>
</template>
<script setup lang="ts">
import type { AutomateViewerPanel_AutomateRunFragment } from '~/lib/common/generated/gql/graphql'
// import { useSelectionUtilities } from '~/lib/viewer/composables/ui'

defineProps<{
  automationRuns: AutomateViewerPanel_AutomateRunFragment[]
}>()

defineEmits(['close'])

const isEmpty = ref(false)
const isAutomationRunning = ref(true)

const functionReleaseId = 'cc84a0d1fb'
const functionId = '4b7c33d5cf'

const runTriggered = () => {
  isEmpty.value = false
  isAutomationRunning.value = true
}

// const { objects } = useSelectionUtilities()
</script>
