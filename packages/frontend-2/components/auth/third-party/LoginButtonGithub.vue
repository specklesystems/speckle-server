<template>
  <AuthThirdPartyLoginButtonBase :to="to">
    <img
      src="~/assets/images/auth/github_icon.svg"
      alt="GitHub Sign In"
      class="w-4 dark:invert grayscale group-hover:grayscale-0"
    />
    <div class="ml-2">Continue with Github</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
