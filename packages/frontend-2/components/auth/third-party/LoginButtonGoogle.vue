<template>
  <AuthThirdPartyLoginButtonBase :to="to" no-vertical-padding>
    <img
      src="~/assets/images/auth/google_icon_w_bg.svg"
      alt="Google Sign In"
      class="w-9 grayscale grayscale group-hover:grayscale-0"
    />
    <div>Continue with Google</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
