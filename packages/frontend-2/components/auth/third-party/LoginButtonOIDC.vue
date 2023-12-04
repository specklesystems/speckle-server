<template>
  <AuthThirdPartyLoginButtonBase :to="to" class="dark:bg-[#2F2F2F]">
    <IdentificationIcon class="h-4" />
    <div>OIDC</div>
  </AuthThirdPartyLoginButtonBase>
</template>
<script setup lang="ts">
import { IdentificationIcon } from '@heroicons/vue/24/outline'

defineProps<{
  to: string
}>()
</script>
