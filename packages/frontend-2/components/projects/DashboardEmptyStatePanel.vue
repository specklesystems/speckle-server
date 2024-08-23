<template>
  <LayoutPanel
    class="w-full max-w-md shadow hover:shadow-xl transition"
    rounded-border-size="2xl"
  >
    <div class="flex flex-col space-y-9 items-center h-full">
      <Component :is="icon" class="h-16 w-16" />
      <div class="text-center grow">
        <h3 class="h4 leading-8 text-foreground"><slot name="title" /></h3>
        <h4 class="mt-2 text-foreground-2">
          <slot name="subtitle" />
        </h4>
      </div>
      <FormButton
        size="lg"
        full-width
        :to="to"
        :icon-left="buttonIcon"
        @click="$emit('click', $event)"
      >
        <slot name="ctaText" />
      </FormButton>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

defineEmits<{
  (e: 'click', v: MouseEvent): void
}>()

defineProps<{
  icon: ConcreteComponent
  buttonIcon: ConcreteComponent
  to?: string
}>()
</script>
