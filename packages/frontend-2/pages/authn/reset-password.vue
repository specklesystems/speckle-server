<template>
  <AuthPasswordResetFinalizationPanel :token="token" />
</template>
<script setup lang="ts">
const route = useRoute()
const token = ref('')

useHead({
  title: 'Reset password'
})

definePageMeta({
  name: 'reset-password'
})

onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token as string
  }
})
</script>
