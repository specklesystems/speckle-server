<template>
  <LayoutDialog v-model:open="openState" max-width="md">
    <template #header>
      <slot name="header" />
    </template>
    <div>
      <div
        class="max-w-2xl w-full flex flex-col gap-4 justify-center pointer-events-auto"
      >
        <slot></slot>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CubeIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const openState = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
