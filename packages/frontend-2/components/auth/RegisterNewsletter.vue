<template>
  <FormCheckbox
    v-model="newsletterConsent"
    name="newsletter"
    label="Opt in for exclusive Speckle news and tips"
    class="text-body-2xs"
  />
</template>

<script setup lang="ts">
const newsletterConsent = ref<true | undefined>(undefined)
</script>
