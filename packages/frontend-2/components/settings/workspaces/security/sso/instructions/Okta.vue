<template>
  <div class="text-body-xs space-y-4">
    <ol class="list-decimal pl-4 space-y-2">
      <li>
        Go to
        <a href="https://developer.okta.com" target="_blank" class="text-primary">
          Okta Developer Console
        </a>
      </li>
      <li>Create a new application (Web application)</li>
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
