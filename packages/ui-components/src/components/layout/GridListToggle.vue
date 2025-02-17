<template>
  <button
    class="max-w-max transition flex justify-center items-center space-x-2 outline-none select-none h-8 text-foreground border-2 border-primary-muted dark:border-foundation bg-primary-muted rounded-md active:scale-[0.97] grow"
    @click="onClick"
  >
    <div class="relative flex bg-primary-muted rounded-md">
      <div
        class="absolute transition"
        :class="{
          'translate-x-7': value !== GridListToggleValue.List
        }"
      >
        <div
          class="w-7 h-7 bg-foundation dark:bg-foundation-2 transition rounded shadow"
        />
      </div>
      <div
        v-tippy="'List View'"
        class="relative z-10 flex space-x-1 items-center p-1 rounded-l"
      >
        <Bars3Icon class="h-5 w-5" />
      </div>
      <div
        v-tippy="'Grid View'"
        class="relative z-10 flex space-x-1 items-center p-1 rounded-r"
      >
        <Squares2X2Icon class="h-5 w-5" />
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
