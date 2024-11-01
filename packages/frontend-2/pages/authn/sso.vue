<template>
  <div>
    <AuthSsoLogin v-if="currentView === 'login'" />
    <AuthSsoRegister v-else />
  </div>
</template>

<script setup lang="ts">
const currentView = computed(() => {
  if (import.meta.client) {
    return window.location.hash === '#register' ? 'register' : 'login'
  }
  return 'login'
})

useHead({
  title: computed(() => `${currentView.value === 'register' ? 'Register' : 'Login'}`)
})
</script>
