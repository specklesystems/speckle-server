<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/downloads'" name="Speckle Connectors"></HeaderNavLink>
    </Portal>
    <SettingsDebug />
    <div class="md:max-w-xl md:mx-auto md:py-12">
      <h1 class="h2">General</h1>
      <div class="flex flex-col gap-y-8 mt-4">
        <p>Manage your server settings</p>
        <hr />
        <SettingsServerGeneral />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
useHead({
  title: 'Settings - Server General'
})
</script>
