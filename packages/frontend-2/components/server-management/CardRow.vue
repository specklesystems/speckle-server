<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1 text-foreground-2 text-sm">
      <span>{{ title }}</span>
    </div>
    <div class="flex justify-between items-center gap-8">
      <span class="text-2xl font-bold">{{ value }}</span>
      <template v-if="cta && cta.type === 'button'">
        <FormButton @click="cta.action">
          {{ cta.label }}
        </FormButton>
      </template>
      <template v-else-if="cta && cta.type === 'link'">
        <FormButton
          color="invert"
          class="shrink-0"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="cta.action"
        >
          {{ cta.label }}
        </FormButton>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'

defineEmits<{
  (e: 'cta-clicked', v: MouseEvent): void
}>()

defineProps<{
  title: string
  value: string
  cta: {
    type: 'button' | 'link'
    label: string
    action: () => void | Promise<void>
  } | null
}>()
</script>
