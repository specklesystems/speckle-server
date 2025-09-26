<template>
  <CommonConfirmDialog
    v-model:open="open"
    title="Large Dataset Warning"
    confirm-text="Continue"
    @confirm="$emit('confirm')"
  >
    <div class="flex flex-col gap-3 text-body-xs">
      <p>
        This property has
        <span class="font-medium">
          {{ count?.toLocaleString() }}
        </span>
        unique values.
      </p>
      <p>
        Processing this filter may cause your browser to become
        <span class="font-medium">temporarily</span>
        unresponsive.
      </p>
      <p>Do you want to continue?</p>
    </div>
  </CommonConfirmDialog>
</template>

<script setup lang="ts">
defineProps<{
  count?: number
}>()

defineEmits<{
  confirm: []
}>()

const open = defineModel<boolean>('open', { required: true })
</script>
