<template>
  <div>
    <div>Projects!</div>
    <div><NuxtPage /></div>
  </div>
</template>
<script setup lang="ts">
useHead({
  title: 'Projects!'
})

definePageMeta({
  test1: 'a'
})
</script>
