<template>
  <button
    class="max-w-max transition flex justify-center items-center gap-2 outline-none select-none h-8 text-foreground border-2 bg-foundation border-foundation-2 rounded-md hover:ring-2 active:scale-[0.97] grow"
    @click="onClick"
  >
    <div class="relative flex bg-foundation rounded-md">
      <div
        class="absolute -top-[2px] -left-[2px] transition"
        :class="{
          'translate-x-7': value !== GridListToggleValue.Grid
        }"
      >
        <div
          :class="value !== GridListToggleValue.Grid ? 'rounded-r-md' : 'rounded-l-md'"
          class="w-8 h-8 bg-primary-muted shadow-inner transition"
        />
      </div>
      <div class="relative z-10 flex gap-1 items-center p-1 rounded-l">
        <Squares2X2Icon class="h-5 w-5" />
      </div>
      <div class="relative z-10 flex gap-1 items-center p-1 rounded-r">
        <Bars3Icon class="h-5 w-5" />
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { Bars3Icon, Squares2X2Icon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'
import { GridListToggleValue } from '~~/src/helpers/layout/components'

const emit = defineEmits<{
  (e: 'click', v: MouseEvent): void
  (e: 'update:modelValue', v: GridListToggleValue): void
}>()

const props = defineProps<{
  modelValue?: GridListToggleValue
}>()

const value = computed({
  get: () => props.modelValue || GridListToggleValue.Grid,
  set: (newVal) => emit('update:modelValue', newVal)
})

const onClick = (e: MouseEvent) => {
  emit('click', e)

  const newVal =
    value.value === GridListToggleValue.Grid
      ? GridListToggleValue.List
      : GridListToggleValue.Grid
  value.value = newVal
}
</script>
