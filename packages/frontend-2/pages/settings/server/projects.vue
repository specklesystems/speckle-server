<template>
  <div>
    <Portal to="navigation" />
    <SettingsDebug />
    <div class="md:max-w-5xl md:mx-auto md:py-12">
      <h1 class="h2">Projects</h1>
      <div class="flex flex-col gap-y-8 mt-4">
        <p>Manage projects on your server</p>
        <hr />
        <SettingsServerProjects />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
useHead({
  title: 'Settings - Projects'
})
</script>
