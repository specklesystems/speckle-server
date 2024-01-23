<template>
  <div class="space-y-2">
    <FilterListSelect v-model:filter="filter" />
    <div class="flex justify-end">
      <FormButton @click="">Send</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ISendFilter } from 'lib/models/card/send'
import { useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()
const { selectionFilter } = storeToRefs(store)

const filter = ref<ISendFilter>({ ...selectionFilter.value })
console.log(filter)
</script>
