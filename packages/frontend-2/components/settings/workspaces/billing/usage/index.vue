<!-- TODO: Update these with real limits once available -->
<template>
  <div class="flex flex-col gap-y-4">
    <SettingsWorkspacesBillingUsageCard
      button-text="Manage seats"
      :current-value="7"
      :max-value="8"
      type="seat"
    />
    <SettingsWorkspacesBillingUsageCard
      button-text="Manage projects"
      :current-value="7"
      :max-value="50"
      type="project"
    />
    <SettingsWorkspacesBillingUsageCard
      button-text="Manage models"
      :current-value="50"
      :max-value="50"
      type="model"
    />
  </div>
</template>

<script lang="ts" setup></script>
