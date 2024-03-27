<template>
  <ProjectPageSettingsBlock title="Webhooks">
    <template #logo><IconWebhooks class="h-5 w-5" /></template>
    <template #introduction>
      <p>
        Webhooks allow you to subscribe to a stream's events and get notified of them in
        real time. You can then use this to trigger ci apps, automation workflows, and
        more.
      </p>
    </template>
    <template #topButtons>
      <FormButton :icon-left="BookOpenIcon" color="invert">Open Docs</FormButton>
      <FormButton :icon-left="PlusIcon">Create Webhook</FormButton>
    </template>
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { PlusIcon, BookOpenIcon } from '@heroicons/vue/24/outline'
</script>
