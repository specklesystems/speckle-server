<template>
  <AuthThirdPartyLoginButtonBase :to="to">
    <img
      src="~/assets/images/auth/ms_icon.svg"
      alt="Microsoft Sign In"
      class="w-4 grayscale mr-2 group-hover:grayscale-0"
    />
    <div>Continue with Microsoft</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
