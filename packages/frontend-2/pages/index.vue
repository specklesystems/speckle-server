<template>
  <div>You shouldnt be here but we will fix it soon 😉</div>
</template>

<script setup lang="ts">
useHead({ title: 'Dashboard' })

definePageMeta({
  middleware: ['auth']
})
</script>
