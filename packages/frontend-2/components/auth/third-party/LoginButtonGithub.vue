<template>
  <AuthThirdPartyLoginButtonBase :to="to" class="dark:border dark:border-[#475569]">
    <img
      src="~/assets/images/auth/github_icon.svg"
      alt="GitHub Sign In"
      class="w-4 dark:invert"
    />
    <div>Github</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
