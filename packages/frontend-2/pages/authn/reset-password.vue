<template>
  <AuthPasswordResetFinalizationPanel :token="token" />
</template>
<script setup lang="ts">
const route = useRoute()
const token = ref('')

onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token as string
  }
})
</script>
