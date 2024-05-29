<template>
  <div class="w-full space-y-2">
    <div class="grid grid-cols-3">
      <div class="col-span-1 truncate border-r mr-1">{{ prop.key }}</div>
      <div v-if="!expandable" class="col-span-2 truncate">{{ prop.value }}</div>
      <div v-if="expandable" class="col-span-2 truncate">
        <FormButton size="xs" text @click="expanded = !expanded">Expand</FormButton>
      </div>
    </div>
    <div v-if="expandable" class="w-full pl-1">
      <!-- <ViewerDataviewerObject :object="prop.value" /> -->
      <ViewerDataviewerObject v-if="expanded" :object="prop.value" />
    </div>
  </div>
</template>
<script setup lang="ts">
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
</script>
