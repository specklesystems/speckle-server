<template>
  <div class="flex flex-col gap-y-0 sm:gap-y-4">
    <div class="flex gap-x-6">
      <FormButton
        v-for="item in items"
        :key="item.id"
        link
        :color="activeItem.id === item.id ? 'default' : 'secondary'"
        @click="onTabClick(item)"
      >
        {{ item.title }}
      </FormButton>
    </div>
    <slot :active-item="activeItem" />
  </div>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Nullable } from '@speckle/shared'
import { computed, ref } from 'vue'
import type { LayoutTabItem } from '~~/src/helpers/layout/components'
import FormButton from '~~/src/components/form/Button.vue'

const props = defineProps<{
  items: LayoutTabItem<any>[]
}>()

const activeItemId = ref(null as Nullable<string>)
const activeItem = computed(() => {
  if (!activeItemId.value) return props.items[0]
  return props.items.find((i) => i.id === activeItemId.value) || props.items[0]
})

const onTabClick = (item: LayoutTabItem) => {
  activeItemId.value = item.id
}
</script>
