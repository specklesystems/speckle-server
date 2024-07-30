<template>
  <LayoutPanel
    ring
    class="cursor-pointer"
    :panel-classes="selected ? 'ring-2' : ''"
    @click="$emit('click', $event)"
  >
    <div class="flex space-x-4">
      <div
        class="w-1/3 bg-center bg-no-repeat bg-contain aspect-square max-w-[100px]"
        :style="{ backgroundImage: `url(${template.logo})` }"
      />
      <div class="flex space-x-1 justify-start items-center self-start">
        <div class="h6 font-medium text-foreground">{{ template.title }}</div>
        <div v-tippy="'Click to read more'">
          <CommonTextLink size="sm" external :to="template.url" target="_blank">
            <InformationCircleIcon class="h-4 w-4 hover:text-primary" />
          </CommonTextLink>
        </div>
      </div>
    </div>
  </LayoutPanel>
</template>
<script setup lang="ts">
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import type { CreatableFunctionTemplate } from '~/lib/automate/helpers/functions'

defineEmits<{
  (e: 'click', val: MouseEvent): void
}>()

defineProps<{
  template: CreatableFunctionTemplate
  selected?: boolean
}>()
</script>
