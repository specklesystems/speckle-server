<template>
  <div class="text-body-xs space-y-4">
    <p>Configure any OpenID Connect compatible provider:</p>
    <ol class="list-decimal pl-4 space-y-2">
      <li>Create a new web application in your provider's console</li>
      <li>Configure OpenID Connect protocol</li>
      <li>Set Grant type to "Authorization Code"</li>
      <li>Add the Redirect URI:</li>
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
