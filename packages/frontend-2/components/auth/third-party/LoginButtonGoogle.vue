<template>
  <AuthThirdPartyLoginButtonBase :to="to" no-vertical-padding class="dark:bg-[#4285F4]">
    <img
      src="~/assets/images/auth/google_icon_w_bg.svg"
      alt="Google Sign In"
      class="w-11 bg-[#ffffff]"
    />
    <div>Google</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
