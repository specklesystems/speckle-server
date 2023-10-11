<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
      <div class="flex gap-2">
        <FormButton
          v-for="(button, index) in buttons"
          :key="index"
          v-bind="button.props"
          class="shrink-0"
          v-on="button.events"
        >
          {{ button.label }}
        </FormButton>
      </div>
    </div>
    <p class="text-sm max-w-5xl">
      <slot></slot>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ConcreteComponent } from 'vue'

defineProps({
  title: String,
  text: String,
  buttons: {
    type: Array as () => ConcreteComponent[],
    default: () => []
  }
})
</script>
