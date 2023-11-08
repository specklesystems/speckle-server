<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="p-2">
    <div
      class="flex flex-col border-dashed border-2 rounded-md border-blue-500/10 items-center justify-center h-[calc(100vh-5.5rem)]"
    >
      <FormButton
        text
        to="/onboarding/send"
        @mouseover="sendHovered = true"
        @mouseout="sendHovered = false"
      >
        Send
      </FormButton>
      <CloudArrowDownIcon
        class="w-8 h-8 text-foreground-2"
        :class="{ 'animated-icon cycling-animation': sendHovered }"
      />
      <img
        class="block h-16 w-16"
        src="~~/assets/images/speckle_logo_big.png"
        alt="Speckle"
      />
      <CloudArrowDownIcon
        class="w-8 h-8 text-foreground-2"
        :class="{ 'animated-icon cycling-animation': receiveHovered }"
      />
      <FormButton
        text
        to="/onboarding/receive"
        @mouseover="receiveHovered = true"
        @mouseout="receiveHovered = false"
      >
        Receive
      </FormButton>
      <div v-if="configStore.onboardingCompleted" class="mt-2 space-y-4">
        <div v-for="project in store.projectModelGroups" :key="project.projectId">
          <CommonProjectModelGroup :project="project" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useHostAppStore } from '~~/store/hostApp'
import { CloudArrowDownIcon } from '@heroicons/vue/20/solid'
import { useConfigStore } from '~/store/config'
const store = useHostAppStore()
const configStore = useConfigStore()

const sendHovered = ref(false)
const receiveHovered = ref(false)
</script>

<style>
.animated-icon {
  transform: translateY(10px); /* Initial position when not hovered */
  transition: transform 0.3s; /* Define the animation duration */
}

.animated-icon.send-hovered {
  transform: translateY(0); /* Target position when hovered */
}

.cycling-animation {
  animation: cycling 1.5s infinite; /* Use your desired duration */
}

.custom-dashed-border {
  border: 2px dashed #888; /* Define your desired dashed border style */
  padding: 4px 8px; /* Adjust padding as needed */
  border-radius: 4px; /* Adjust border radius as needed */
  transition: border 0.3s; /* Define the transition effect */
}

.custom-dashed-border:hover {
  border: 2px dashed #00f; /* Define the border style on hover */
}

@keyframes cycling {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}
</style>
