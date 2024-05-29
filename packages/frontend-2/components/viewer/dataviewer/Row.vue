<template>
  <div
    :class="`w-full bg-foundation-2 hover:bg-blue-500/5 rounded px-1 py-1 border-l-2 text-xs ${
      expandable && !expanded
        ? 'border-blue-500 border-opacity-50'
        : 'border-neutral-500 border-opacity-20'
    } `"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`grid grid-cols-3 ${expandable ? 'cursor-pointer' : ''}`"
      @click="handleExpand"
    >
      <div
        class="col-span-1 truncate mr-1 flex items-center text-foreground-2 font-semibold"
      >
        <ChevronRightIcon
          v-if="expandable"
          :class="`w-3 ${expanded ? 'rotate-90' : ''} transition `"
        />
        <span>{{ prop.key }}</span>
      </div>
      <div v-if="!expandable" class="col-span-2 truncate">{{ prop.value }}</div>
      <div v-if="expandable" class="col-span-2 truncate">
        {{ prop.type }}
        <span v-if="prop.type === 'array'" class="text-foreground-2 text-xs">
          ({{ prop.value.length }})
        </span>
      </div>
    </div>
    <div v-if="expandable && expanded" class="w-full pl-1 pt-2">
      <!-- <ViewerDataviewerObject :object="prop.value" /> -->
      <ViewerDataviewerObject :object="prop.value" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
const props = defineProps<{
  prop: {
    key: string
    value: unknown
    type: string
  }
}>()

const expanded = ref(false)

const expandable = computed(() => {
  return props.prop.type === 'array' || props.prop.type === 'object'
})

const handleExpand = () => {
  if (!expandable.value) return
  expanded.value = !expanded.value
}
</script>
