<template>
  <AuthThirdPartyLoginButtonBase :to="to" class="dark:bg-[#2F2F2F]">
    <img src="~/assets/images/auth/ms_icon.svg" alt="Microsoft Sign In" class="w-4" />
    <div>Microsoft</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>
