<!-- eslint-disable vue/no-v-html -->
<template>
  <FormCheckbox
    v-model="newsletterConsent"
    name="newsletter"
    label="Opt in for exclusive Speckle news and tips"
    class="text-body-2xs"
  />
</template>

<script setup lang="ts">
const newsletterConsent = defineModel<boolean>('newsletterConsent', { required: true })
</script>
