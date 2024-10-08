<template>
  <div
    class="flex flex-col gap-y-1 sm:gap-y-2 border border-outline-3 rounded-lg py-2 px-3 sm:p-4 select-none"
  >
    <h6
      v-if="title"
      class="text-body-xs sm:text-heading-sm font-medium text-foreground"
    >
      {{ title }}
    </h6>
    <p v-if="text" class="text-body-2xs sm:text-body-xs text-foreground-2 !leading-5">
      {{ text }}
    </p>
    <FormButton
      v-if="buttonText"
      size="sm"
      class="mt-1"
      :to="to"
      :target="to ? '_blank' : undefined"
      @click="$emit('onClick')"
    >
      {{ buttonText }}
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import FormButton from '~~/src/components/form/Button.vue'

defineEmits(['onClick'])

defineProps<{
  title?: string
  text?: string
  to?: string
  buttonText?: string
}>()
</script>
