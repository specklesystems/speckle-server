<template>
  <PresentationStateSetup>
    <PresentationPageWrapper />
  </PresentationStateSetup>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'empty',
  middleware: ['require-valid-presentation']
})

useHead({
  meta: [
    {
      name: 'viewport',
      content:
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    }
  ]
})
</script>
