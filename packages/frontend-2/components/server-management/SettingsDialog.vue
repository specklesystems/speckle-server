<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6">
      <FormTextInput
        label="This server’s public name"
        name="serverName"
        placeholder="Server name"
        show-label
        value="Server name"
        :show-required="true"
        :type="'text'"
        :rules="{ required: true, min: 3, max: 50 }"
      />
      <FormTextArea
        label="Description"
        name="description"
        placeholder="Description"
        show-label
        model-value="“It's no use going back to yesterday, because I was a different person then.”"
        :rules="{ min: 3, max: 300 }"
      />
      <FormTextInput
        label="Owner"
        name="owner"
        placeholder="Owner"
        show-label
        value="Owner"
        :type="'text'"
        :rules="{ min: 3, max: 50 }"
      />
      <FormTextInput
        label="Admin Email"
        name="adminEmail"
        placeholder="Admin Email"
        show-label
        value="admin@aessystems.com"
        :type="'email'"
        :rules="{ min: 3, max: 50 }"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog, FormTextInput, FormTextArea } from '@speckle/ui-components'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
