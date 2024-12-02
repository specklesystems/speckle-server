<template>
  <div class="text-body-xs space-y-2">
    <p>Configure any OpenID Connect compatible provider:</p>
    <ol class="list-decimal pl-4 space-y-2">
      <li>Create a new web application in your provider's console</li>
      <li>Configure OpenID Connect protocol</li>
      <li>
        <SettingsWorkspacesSecuritySsoInstructionsScopes />
      </li>
      <li>
        Add the Redirect URI:
        <CommonClipboardInputWithToast is-multiline :value="redirectUrl" />
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  redirectUrl: string
}>()
</script>
