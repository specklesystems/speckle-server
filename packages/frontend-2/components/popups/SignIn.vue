<template>
  <AuthLoginPanel
    v-model:open="showDialog"
    dialog-mode
    max-width="sm"
    subtitle="Create a free account to keep using Speckle!"
  />
</template>
<script setup lang="ts">
const route = useRoute()

const showDialogBase = ref(false)

const showDialog = computed({
  get: () => showDialogBase.value,
  set: (newVal) => {
    if (newVal && route.fullPath.startsWith('/error')) {
      return
    }

    showDialogBase.value = newVal
  }
})
</script>
