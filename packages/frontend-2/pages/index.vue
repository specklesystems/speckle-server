<template>
  <div>
    <ActiveUserTest />
    <ActiveUserTest />
    <NotificationsDashboardList />
    <ModelDashboardList :num-models="Math.floor(Math.random() * 5 + 1)" />
    <ProjectList :num-projects="Math.floor(Math.random() * 15 + 1)" />
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  title: 'Dashboard'
})
</script>
