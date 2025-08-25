<template>
  <div
    class="bg-foundation-page shadow-sm flex flex-col gap-y-1 sm:gap-y-2 border border-outline-3 rounded-lg py-2 px-3 sm:p-4 select-none"
  >
    <div class="flex justify-between items-center">
      <h6
        v-if="title"
        class="text-body-xs sm:text-heading-sm font-medium text-foreground"
      >
        {{ title }}
      </h6>
      <X
        v-if="showCloser"
        v-keyboard-clickable
        class="h-4 w-4 cursor-pointer focus:outline-none"
        @click="$emit('close', $event)"
      />
    </div>
    <p v-if="text" class="text-body-2xs sm:text-body-xs text-foreground-2 !leading-5">
      {{ text }}
    </p>
    <div class="flex justify-end">
      <FormButton
        v-if="button"
        size="sm"
        class="mt-1"
        :to="button.to"
        :target="button.to ? '_blank' : undefined"
        @click="$emit('click', $event)"
      >
        {{ button.title }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormButton from '~~/src/components/form/Button.vue'
import { X } from 'lucide-vue-next'
import { vKeyboardClickable } from '~~/src/directives/accessibility'

defineEmits<{
  click: [e: MouseEvent]
  close: [e: MouseEvent]
}>()

defineProps<{
  title?: string
  text?: string
  button?: { to?: string; title: string }
  showCloser?: boolean
}>()
</script>
