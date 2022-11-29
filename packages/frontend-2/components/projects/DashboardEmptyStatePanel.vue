<template>
  <LayoutPanel class="w-full max-w-md" rounded-border-size="base">
    <div class="flex flex-col space-y-9 items-center h-full">
      <Component :is="icon" class="h-16 w-16" />
      <div class="text-center grow">
        <h3 class="h4 font-bold leading-8 text-foreground"><slot name="title" /></h3>
        <h4 class="h5 font-normal leading-7 text-foreground-2">
          <slot name="subtitle" />
        </h4>
      </div>
      <FormButton size="lg" full-width :to="to" @click="$emit('click', $event)">
        <slot name="ctaText" />
      </FormButton>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { ConcreteComponent } from 'vue'

defineEmits<{
  (e: 'click', v: MouseEvent): void
}>()

defineProps<{
  icon: ConcreteComponent
  to?: string
}>()
</script>
