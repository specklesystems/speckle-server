<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="p-2">
    <div class="z-50 pb-2">
      <OnboardingV1></OnboardingV1>
    </div>
    <div class="space-y-3">
      <div v-for="i in 8" :key="i">
        <div
          class="text-foreground-2 border-dashed border rounded-md border-blue-500/10 hover:shadow-md shadow transition overflow-hidden flex h-20 items-center justify-center"
        >
          <div class="opacity-20">Model</div>
        </div>
      </div>
    </div>

    <!-- Some animative examples -->
    <!-- <div
      class="pb-5 flex flex-col border-dashed border-2 rounded-md border-blue-500/10 items-center justify-center h-[calc(100vh-16rem)]"
    >
      <div class="relative">
        <div class="dashed-rectangle">
          <div @mouseover="sendHovered = true" @mouseout="sendHovered = false">
            <FormButton class="w-10rem" text to="/onboarding/send">Send</FormButton>
          </div>
          <CloudArrowDownIcon
            class="w-8 h-8 text-foreground-2"
            :class="{ 'animated-icon cycling-send-animation': sendHovered }"
          />
        </div>
      </div>
      <img
        class="block h-24 w-24"
        src="~~/assets/images/speckle_logo_big.png"
        alt="Speckle"
      />
      <div class="relative">
        <div class="dashed-rectangle">
          <CloudArrowDownIcon
            class="w-8 h-8 text-foreground-2"
            :class="{ 'animated-icon cycling-receive-animation': receiveHovered }"
          />
          <div @mouseover="receiveHovered = true" @mouseout="receiveHovered = false">
            <FormButton text to="/onboarding/receive">Receive</FormButton>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>
<script setup lang="ts">
// import { CloudArrowDownIcon } from '@heroicons/vue/20/solid'
// import { useConfigStore } from '~/store/config'
// const configStore = useConfigStore()

// const sendHovered = ref(false)
// const receiveHovered = ref(false)
</script>

<style>
.animated-icon {
  transform: translateY(10px); /* Initial position when not hovered */
  transition: transform 0.3s; /* Define the animation duration */
}

.animated-icon.send-hovered {
  transform: translateY(0); /* Target position when hovered */
}

.cycling-send-animation {
  animation: cycling-send 1.5s infinite; /* Use your desired duration */
}

.cycling-receive-animation {
  animation: cycling-receive 1.5s infinite; /* Use your desired duration */
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

.dashed-rectangle {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Style for the rectangle around the Send button, CloudArrowDownIcon, and the image */
.dashed-rectangle-hover {
  border: 2px dashed #888; /* Border color for the dashed rectangle */
  border-radius: 4px; /* Adjust border radius as needed */
  z-index: 1; /* Place it behind other content */
  pointer-events: all; /* Allow interactions with underlying elements */
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes cycling-send {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(1rem);
  }
}

@keyframes cycling-receive {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-1rem);
  }
}
</style>
