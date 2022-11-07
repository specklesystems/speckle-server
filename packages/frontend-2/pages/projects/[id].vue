<template>
  <div>Project: {{ $route.params.id }}</div>
</template>
<script setup lang="ts">
const route = useRoute()

// Load project name from API
const apiCall = new Promise<string>((resolve) => {
  setTimeout(() => resolve('this comes from an API'), 500)
})
const projectName = await apiCall

// Set it in meta & page title
route.meta.test2 = `Projects - ${projectName}`

useHead({
  title: projectName
})

onMounted(() => {
  // You'll get the value here
  console.log(route.meta.test2)
})
</script>
