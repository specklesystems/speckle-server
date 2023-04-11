<template>
  <AuthThirdPartyLoginButtonBase :to="to" no-vertical-padding>
    <img
      src="~/assets/images/auth/google_icon_w_bg.svg"
      alt="Google Sign In"
      class="w-11"
    />
    <div>Google</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
