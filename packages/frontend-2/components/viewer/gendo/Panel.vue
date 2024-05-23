<template>
  <ViewerLayoutPanel move-actions-to-bottom @close="$emit('close')">
    <template #title>
      AI Render by Gendo
      <span class="text-foreground-2">(Beta)</span>
    </template>
    <div class="p-1">
      <div class="space-y-2 flex flex-col">
        <FormTextArea name="prompt" label="" placeholder="Your prompt" />
        <div class="text-right">
          <FormButton>Render</FormButton>
        </div>
      </div>
      <div class="p-2 text-xs text-foreground-2">
        TODO Empty state explaining WTF this does
      </div>
    </div>
    <template #actions>
      <div class="text-right grow">
        <span class="text-foreground-2 text-sm">Learn more about</span>
        <CommonTextLink
          text
          link
          size="sm"
          class="ml-1"
          to="https://gendo.ai"
          target="_blank"
        >
          Gendo
        </CommonTextLink>
      </div>
    </template>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
defineEmits<{
  (e: 'close'): void
}>()
</script>
