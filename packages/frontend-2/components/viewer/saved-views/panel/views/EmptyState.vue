<template>
  <div class="flex flex-col items-center gap-8 my-16">
    <IllustrationEmptystateViewsTab />
    <div class="text-center mx-6 text-body-xs">
      <div class="text-foreground-2 font-medium">
        {{ message }}
      </div>
      <div v-if="type === 'base'" class="text-foreground-3 mt-2">
        Save, organize and share views
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'base' | 'search'
  }>(),
  {
    type: 'base'
  }
)

const message = computed(() => {
  if (props.type === 'search') {
    return 'No views found'
  }
  return 'No saved views yet'
})
</script>
