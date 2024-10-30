<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader
        title="Regions"
        text="Manage the regions available for customizing data residency"
      />
      <div class="flex flex-col space-y-6">
        <div class="flex flex-row-reverse">
          <FormButton @click="isAddEditDialogOpen = true">Create</FormButton>
        </div>
        <SettingsServerRegionsTable />
      </div>
    </div>
    <SettingsServerRegionsAddEditDialog v-model:open="isAddEditDialogOpen" />
  </section>
</template>
<script setup lang="ts">
const isAddEditDialogOpen = ref(false)
</script>
