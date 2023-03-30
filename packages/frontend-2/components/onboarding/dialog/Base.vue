<template>
  <div class="w-screen h-screen z-50 fixed inset-0">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      class="w-screen h-screen fixed inset-0 bg-neutral-100/70 dark:bg-neutral-900/70"
      @click="allowCancel ? emit('cancel') : ''"
    ></div>
    <div
      class="relative w-screen h-screen flex items-center justify-center pointer-events-none"
    >
      <div class="max-w-2xl w-full flex flex-col justify-center pointer-events-auto">
        <div
          class="bg-blue-500/50 border-4 border-primary-muted text-foreground-on-primary backdrop-blur shadow-lg rounded-xl p-4 space-y-4 w-full"
        >
          <h2 class="text-center text-2xl font-bold">
            <slot name="header">Dialog Header</slot>
          </h2>
          <slot></slot>
        </div>
        <div v-if="allowCancel" class="pt-2 flex justify-center">
          <FormButton size="sm" @click.stop="emit('cancel')">
            {{ cancelPrompt }}
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const emit = defineEmits(['close', 'cancel'])
withDefaults(defineProps<{ allowCancel?: boolean; cancelPrompt?: string }>(), {
  allowCancel: true,
  cancelPrompt: 'Cancel'
})
</script>
