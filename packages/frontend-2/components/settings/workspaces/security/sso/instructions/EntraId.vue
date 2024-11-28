<template>
  <div class="text-body-xs space-y-4">
    <p>To configure Microsoft Entra ID SSO:</p>
    <ol class="list-decimal pl-4 space-y-2">
      <li>Go to Azure Portal > Microsoft Entra ID</li>
      <li>Navigate to App registrations</li>
      <li>Register a new application (Web platform)</li>
      <li>Under Authentication, add the Redirect URI:</li>
    </ol>

    <div>
      <CommonClipboardInputWithToast is-multiline :value="redirectUrl" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  redirectUrl: string
}>()
</script>
