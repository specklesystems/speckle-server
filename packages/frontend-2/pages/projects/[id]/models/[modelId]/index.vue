<template>
  <ViewerPreSetupWrapper />
  <div
    class="fixed shadow-t bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
  >
    <PortalTarget class="sm:hidden" name="bottomPanel"></PortalTarget>
    <PortalTarget class="sm:hidden" name="mobileComments"></PortalTarget>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})
</script>
