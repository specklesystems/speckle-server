<template>
  <LayoutPanel
    ring
    class="cursor-pointer"
    :panel-classes="selected ? 'ring-1' : ''"
    @click="$emit('click', $event)"
  >
    <div class="flex space-x-4 items-center">
      <div
        class="w-1/3 bg-center bg-no-repeat bg-contain aspect-square max-w-[45px]"
        :style="{ backgroundImage: `url(${template.logo})` }"
      />
      <div class="flex flex-col space-y-2">
        <div class="text-heading-sm font-medium text-foreground leading-none">
          {{ template.title }}
        </div>
        <CommonTextLink
          class="h-auto leading-none"
          :to="template.url"
          target="_blank"
          size="sm"
        >
          Read more
        </CommonTextLink>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import type { CreatableFunctionTemplate } from '~/lib/automate/helpers/functions'

defineEmits<{
  (e: 'click', val: MouseEvent): void
}>()

defineProps<{
  template: CreatableFunctionTemplate
  selected?: boolean
}>()
</script>
