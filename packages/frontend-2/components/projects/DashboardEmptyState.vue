<template>
  <div class="empty-state w-full min-h-[100px] bg-foundation-2 rounded-2xl pt-28 pb-40">
    <h2 class="block h4 font-bold leading-8 text-center">
      Welcome to Speckle. What would you like to do?
    </h2>
  </div>
</template>
<script setup lang="ts">
/**
 * TODO:
 * - Discuss heading stylings with Carlos
 * - Set up merge functions from frontend-1 to get rid of warning in console on homepage
 */
</script>
<style scoped>
.empty-state {
  /** dashbed border */
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='rgb(59 130 246 / 50%)' stroke-width='1' stroke-dasharray='14' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e");
}
</style>
