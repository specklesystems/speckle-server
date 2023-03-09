<template>
  <div :class="`min-h-full relative`">
    <div
      class="fixed z-40 bottom-0 w-full text-xs flex space-x-2 p-3 pointer-events-none"
    >
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showNavbar = !tourState.showNavbar"
      >
        nav
      </FormButton>
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showViewerControls = !tourState.showViewerControls"
      >
        viewer ctrls
      </FormButton>
      <FormButton
        class="pointer-events-auto"
        size="xs"
        @click="tourState.showTour = !tourState.showTour"
      >
        tour ctrls
      </FormButton>
      <!-- <span>{{ tourState }}</span> -->
    </div>

    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition duration-1000"
    >
      <HeaderNavBar v-show="tourState.showNavbar" class="mb-6 z-20 relative" />
    </Transition>
    <main class="absolute w-screen h-screen top-0 left-0 z-10">
      <slot />
    </main>
    <SingletonManagers class="z-30" />
  </div>
</template>
<script setup lang="ts">
const tourState = useTourStageState()
</script>
