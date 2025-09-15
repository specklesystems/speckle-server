<template>
  <div
    class="flex justify-between items-center p-1 sticky top-0 bg-foundation border-b border-outline-2 w-full transition z-[100] pr-2"
  >
    <HeaderLogoBlock />
    <div class="flex flex-row items-center justify-between space-x-1">
      <UserMenu v-if="accountStore.account" />
    </div>
  </div>
</template>
<script setup lang="ts">
const accountStore = useAccountStore()
</script>
