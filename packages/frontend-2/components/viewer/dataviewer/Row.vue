<template>
  <div
    :class="`w-full bg-foundation-2 hover:bg-blue-500/5 rounded px-1 py-1 border-l-2 text-xs ${
      expandable ? 'border-blue-500' : 'border-transparent'
    } ${expanded ? 'border-neutral-500 border-opacity-30' : ''}`"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`grid grid-cols-3 ${expandable ? 'cursor-pointer' : ''}`"
      @click="handleExpand"
    >
      <div class="col-span-1 mr-1 flex items-center text-foreground-2 font-semibold">
        <ChevronRightIcon
          v-if="expandable"
          :class="`w-3 ${expanded ? 'rotate-90' : ''} transition shrink-0 `"
        />
        <span class="select-all truncate">{{ prop.key }}</span>
      </div>
      <div v-if="!expandable" class="col-span-2 truncate select-all">
        {{ prop.value }}
      </div>
      <div v-if="expandable" class="col-span-2 truncate">
        {{ prop.type }}
        <span v-if="prop.type === 'array'" class="text-foreground-2 text-xs">
          ({{ arrayLen }})
        </span>
      </div>
    </div>
    <div v-if="expandable && expanded" class="w-full pl-1 pt-2">
      <ViewerDataviewerObject :object="castProp" />
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

const arrayLen = computed(() => {
  if (props.prop.type !== 'array') return
  const arr = props.prop.value as unknown[]
  return arr.length
})

const castProp = computed(() => {
  return props.prop.value as Record<string, unknown>
})

const handleExpand = () => {
  if (!expandable.value) return
  expanded.value = !expanded.value
}
</script>
