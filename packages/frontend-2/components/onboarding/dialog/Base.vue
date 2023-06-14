<template>
  <LayoutDialog v-model:open="openState" max-width="md">
    <div>
      <div class="max-w-2xl w-full flex flex-col justify-center pointer-events-auto">
        <div class="space-y-4 w-full">
          <h2 class="text-center text-3xl font-bold">
            <slot name="header">Dialog Header</slot>
          </h2>
          <slot></slot>
        </div>
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
